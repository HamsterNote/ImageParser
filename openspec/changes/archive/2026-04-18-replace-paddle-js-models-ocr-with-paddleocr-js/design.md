## Context

当前 `ImageParser` 在 `src/index.ts` 中通过动态导入 `@paddlejs-models/ocr`，以单例 Promise 缓存 `init()` 结果，再调用 `recognize()` 获取 `{ text, points }` 并归一化为内部 `NormalizedOcrTextBlock`。该实现已经和 `ImageParser.encode()`、`ImageParser.decode()`、Demo 预览以及 Jest mock 形成稳定耦合：

- 编码链路依赖 OCR 结果中的文本与坐标，继续映射为 `IntermediateDocument` / `IntermediateText`
- 解码链路依赖上述中间文档结构回放文本块与原图缩略图
- 打包配置当前将 `@paddlejs-models/ocr` 视为 external，Demo 通过 `demo/paddlejs-ocr-shim.js` 暴露 `init` / `recognize`
- 测试通过模块 mock 固定旧运行时接口，验证运行时加载、结果归一化与 dist 互操作

新目标库 `@paddleocr/paddleocr-js` 的接口模型不同：推荐使用 `PaddleOCR.create()` 创建实例，推理入口为 `predict()`，释放入口为 `dispose()`，输出结构也从扁平的 `text` / `points` 切换为 `items[].text` / `items[].poly` / `items[].score`。同时它内部引入 OpenCV.js 与 ONNX Runtime Web，Worker、WASM 路径、线程能力与浏览器隔离头都可能影响集成方式。因此本次迁移不仅是包名替换，还需要重新定义运行时适配层、结果归一化边界与浏览器打包策略。

## Goals / Non-Goals

**Goals:**
- 在不改变 `ImageParser.encode()` / `decode()` 对外契约的前提下，将 OCR 运行时切换为 `@paddleocr/paddleocr-js`
- 将第三方 OCR 生命周期限制在内部适配层，统一为“创建 → 推理 → 释放/复用”的受控流程
- 将新结果结构稳定归一化为现有中间文档所需的文本块、边界框与基础元数据
- 保持 Demo、构建产物和测试桩可继续验证浏览器端 OCR 行为
- 为后续升级 `@paddleocr/paddleocr-js` 版本保留清晰的配置与回滚边界

**Non-Goals:**
- 不在本次变更中重做 `IntermediateDocument` / `IntermediateText` 数据模型
- 不引入新的 OCR 可视化能力或多语言模型切换 UI
- 不默认启用 Worker、多线程 WASM 或 WebGPU 等需要额外宿主配置的高级模式
- 不扩展 Node 端 OCR 支持；仍以浏览器端能力为主

## Decisions

### 1. 引入独立的 OCR 适配层，隔离第三方 API

在 `src/index.ts` 内部新增面向 `ImageParser` 的运行时适配边界，负责：加载 `@paddleocr/paddleocr-js` 模块、创建 OCR 实例、执行 `predict()`、将结果转换为内部统一类型，以及在失败时复位缓存。`ImageParser` 上层不直接消费第三方模块返回值。

这样可以把 `create()` / `predict()` / `dispose()` 与外部文档模型解耦，后续若 `@paddleocr/paddleocr-js` 升级或需要替换配置，仅修改适配层即可。

备选方案：
- 直接在 `runOcr()` 中内联新库调用：实现最快，但会让初始化、结果结构和错误处理散落在主流程中，后续维护成本高
- 完全新增独立文件导出公共适配器：结构更清晰，但当前变更范围以 OpenSpec 工件和现有单入口实现为主，先在内部抽象即可满足隔离目标

### 2. 采用“懒加载 + 单实例复用 + 显式释放”的生命周期策略

新运行时通过 `PaddleOCR.create()` 异步创建实例，并缓存为单例 Promise，行为与当前实现的懒加载语义保持一致。单次 `encode()` 执行期间复用同一个 OCR 实例；当实例创建失败或推理异常表明实例不可继续使用时，清空缓存，确保下一次调用可重新创建。包级别额外暴露一个仅供测试/内部使用的释放入口，用于在测试结束或未来宿主明确需要时调用 `dispose()`。

这样做的原因：
- 保持现有 `loadPaddleOcrRuntime()` 的单例特征，减少对 `ImageParser` 主流程的改动
- 避免每次识别都重新加载模型，降低浏览器初始化成本
- 为测试与 Demo 提供资源释放钩子，避免长期会话下残留 WebAssembly / Worker 资源

备选方案：
- 每次 `encode()` 新建并立即 `dispose()`：资源隔离更强，但初始化开销大，且会放大模型加载延迟
- 永不 `dispose()`：实现最简单，但长期页面会话中更容易积累内存与 worker 资源

### 3. 使用内部归一化结构屏蔽 `predict()` 的数组化输出

`@paddleocr/paddleocr-js` 的 `predict()` 返回每张图片一个 `OcrResult`，核心文本结果位于 `items[]`。适配层统一只处理单张图片场景：

- 取首个 `OcrResult` 作为当前图片识别结果
- 从 `items[].text` 提取文本，去除空白项
- 从 `items[].poly` 计算轴对齐包围盒，继续复用现有 `toBoundingBox` / `createOcrText` 逻辑
- 记录 `items[].score` 作为可选调试信息，但不写入 `IntermediateDocument`
- 当返回空数组、缺少 `items` 或坐标非法时，按“无有效文本块”或“推理失败”进入统一错误/降级分支

这样可以保持 `ImageParser.encode()` 输出稳定，同时不让新的多边形结构泄漏到中间文档层。

备选方案：
- 直接把多边形写入中间文档：信息更完整，但需要同步扩展多个下游类型与渲染逻辑，超出本次范围
- 继续假设第三方返回扁平 `text` / `points`：迁移成本低，但与新库真实接口不符，风险高

### 4. 默认采用主线程、最小宿主依赖的浏览器配置

为了保持当前包可直接在 Demo 与现有宿主环境中运行，本次设计默认不启用 Worker、多线程或 WebGPU，优先使用最小兼容配置运行 `@paddleocr/paddleocr-js`。若库要求显式传入模型、WASM 或 ORT 资源路径，则通过适配层集中配置，并在 Demo 中提供对应静态资源映射；打包层只负责 external/alias 与 shim 更新，不把路径细节扩散到 `ImageParser` 业务逻辑。

这样做的原因：
- Worker/多线程通常要求 COOP/COEP，当前项目和 Demo 没有此类宿主保障
- 先以主线程跑通功能，可以将风险集中在 API 迁移而不是浏览器隔离策略
- 未来若宿主具备更强运行环境，可在适配层中逐步开放高级配置

备选方案：
- 默认启用 Worker：理论上性能更好，但会引入额外构建、资源路径与跨源隔离成本
- 把所有运行时配置暴露给 `ImageParser.encode()`：灵活性更高，但会破坏当前简洁 API

### 5. 测试与 Demo 统一切换到新生命周期 mock

单元测试、dist 互操作测试与 Demo shim 统一模拟 `create()` 返回的 OCR 实例，而不是继续 mock `init()` / `recognize()`。测试重点转为验证：实例仅创建一次、`predict()` 输入类型正确、结果 `items[].poly` 被正确归一化、错误时缓存会被清空，以及释放逻辑不会破坏后续调用。

这样可以使测试与真实运行时生命周期一致，减少“实现已迁移但 mock 仍停留在旧接口”造成的假通过。

备选方案：
- 仅替换模块名但保留旧 mock 结构：改动最小，但几乎不能覆盖迁移风险
- 用端到端浏览器测试替代单元 mock：真实性更高，但当前项目测试基建并未为此准备

## Risks / Trade-offs

- [新库资源路径或模型文件加载方式与当前 Demo/打包不兼容] → 在适配层集中管理路径配置，并在 Demo 中显式补充静态资源映射与说明
- [默认主线程执行导致大图识别延迟上升] → 先保证功能兼容，后续在宿主具备 COOP/COEP 时再评估 Worker 作为增量优化
- [`predict()` 输出结构后续版本变动] → 锁定依赖版本，并通过归一化测试覆盖 `items` / `poly` / `text` 的核心结构假设
- [实例缓存未正确释放导致内存上涨] → 提供内部释放入口并在测试中覆盖失败复位与显式释放场景
- [结果从多边形收敛为矩形后，坐标精度略有损失] → 保持与当前 `IntermediateText` 模型兼容，若未来确需多边形精度，再单独扩展下游模型

## Migration Plan

1. 将依赖从 `@paddlejs-models/ocr` 切换为固定版本的 `@paddleocr/paddleocr-js`，并补齐必要类型声明或导入调整。
2. 在运行时适配层完成 `create()` / `predict()` / `dispose()` 封装，替换旧的 `init()` / `recognize()` 逻辑。
3. 将 `normalizeOcrResult()` 从旧的 `text` / `points` 结构迁移到 `items[].text` / `items[].poly`。
4. 更新 `rolldown.config.ts`、Demo shim 与相关静态资源配置，确保浏览器示例可继续加载 OCR 运行时。
5. 重写测试 mock 与断言，覆盖实例生命周期、结果归一化、错误传播与 dist 互操作。
6. 验证 `encode()`、`decode()` 与 Demo 预览链路保持可用后，再补充 CHANGELOG 与后续实现任务。

回滚策略：若迁移后发现资源路径、宿主兼容性或结果结构存在阻塞问题，可直接回退依赖版本与适配层修改，恢复 `@paddlejs-models/ocr` 接入，不影响中间文档模型。

## Open Questions

- `@paddleocr/paddleocr-js` 在当前项目使用场景下，是否必须显式提供 ORT / 模型静态资源路径，还是默认资源解析即可工作？
- Demo 示例是否需要额外分发 OpenCV.js / ONNX Runtime Web 相关资源文件，还是能完全依赖包内解析？
- 当前项目是否需要在近期支持批量图片识别；若需要，是否要提前把内部适配层设计成可处理 `predict()` 的数组输入？
