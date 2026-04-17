## Context

`ImageParser.encode()` 当前只会基于输入字节数生成占位 `IntermediateDocument`，并未执行真实 OCR。调用方虽然已经能通过 `inspect` / `encode` 打通接口，但图片导入链路仍无法产出可被 Hamster Note 消费的正文内容。

本次变更计划在浏览器环境中引入 `@paddlejs-models/ocr`，将图片输入解码、OCR 调用、结果归一化和 `IntermediateDocument` 构建串成一条真实编码链路。受影响范围包括：

- `src/index.ts`：从占位实现升级为真实 OCR 编码实现
- `src/__tests__/imageParser.test.ts`：从占位断言升级为 OCR 行为断言
- `demo/demo.js`：展示真实 OCR 编码结果而非占位文本
- `package.json`：增加 OCR 运行时依赖

当前接口约束仍保持不变：输入类型继续支持 `ArrayBuffer`、`ArrayBufferView` 与 `Blob`，对外返回 `IntermediateDocument`，`decode()` 仍不在本次范围内。

## Goals / Non-Goals

**Goals:**

- 为图片输入提供首个可用的 OCR 编码实现，而不是占位文档。
- 将 OCR 结果稳定映射为单页 `IntermediateDocument`，保留基础版面信息供后续消费。
- 明确区分“识别成功但无文字”和“识别失败”两类结果。
- 将第三方 OCR 细节封装在 `ImageParser` 内部，避免把外部库返回结构泄漏到公共 API。
- 通过测试与 demo 验证浏览器侧图片 OCR 编码链路可用。

**Non-Goals:**

- 不实现 `ImageParser.decode()`。
- 不在本次引入多页图片、批量 OCR 或版面重建能力。
- 不追求像素级还原字体、字号和复杂排版，只提供可消费的基础文本块与坐标信息。
- 不扩展 `ParserInput` 的公开类型范围。

## Decisions

### 1. 在 `src/index.ts` 内增加 OCR 适配层，隔离第三方模型 API

`ImageParser.encode()` 不直接散落调用 `@paddlejs-models/ocr`，而是拆成若干内部步骤：输入归一化、图片解码、OCR 调用、结果归一化、文档构建。这样做有两个目的：

- 避免未来更换 OCR 引擎时影响公开接口。
- 让测试可以 mock 内部边界，而不是依赖真实模型与浏览器图形环境。

备选方案是直接在 `encode()` 中串联第三方调用，但这会让错误处理、测试替身和后续维护都变得更脆弱，因此不采用。

### 2. 统一先将输入转成浏览器可解码图片，再进入 OCR

虽然 `ParserInput` 可来自 `Blob`、`ArrayBuffer` 或 TypedArray，但 OCR 和版面尺寸都依赖图片对象本身。因此内部会先把输入统一转成 `Blob`，再解码为浏览器可读取的图片表示，并提取宽高。

推荐路径为：

- 保留现有 `toUint8Array()` 入口，统一得到字节数据。
- 根据已知 MIME 或回退默认 MIME 创建 `Blob`。
- 在浏览器环境中解码出图片尺寸与可供 OCR 消费的图像对象。

这样可以把输入差异收敛到一处。备选方案是对不同输入类型分别走独立分支，但会重复处理 MIME、异常与尺寸提取逻辑，不采用。

### 3. 以“单图单页”映射 OCR 结果，构建最小可用版面信息

每次 `encode()` 对应一个 `IntermediateDocument`，其中只包含一个 `IntermediatePage`。页面宽高直接使用解码后的原图尺寸。OCR 输出中的文本块会被映射为多个 `IntermediateText`，每个文本项至少包含：

- 文本内容
- 边界框推导出的 `x`、`y`、`width`、`height`
- 基础排版回退值，如 `fontFamily`、`fontSize`、`lineHeight`
- 稳定生成的 `id`

由于 OCR 无法可靠提供真实字体与排版，本次统一使用保守默认值补齐 `IntermediateText` 所需字段；坐标与尺寸以 OCR 边界框为准。备选方案是只输出纯文本、不提供坐标，但会削弱中间文档的消费价值，因此不采用。

### 4. 用“空文本文档”与“显式异常”区分空结果和失败

为了满足调用方区分两类结果的要求，`encode()` 采用以下语义：

- **识别成功但无文字**：返回合法的 `IntermediateDocument`，其中页面存在但 `texts` 为空。
- **识别失败**：抛出结构明确的错误，错误消息聚焦于模型加载失败、图片解码失败或 OCR 执行失败。

这样调用方无需额外读取 side channel，就能通过“是否抛错”区分失败，通过“页面文本是否为空”区分无文字。备选方案是无文字时也抛错，但那会把正常业务分支误报为异常，不采用。

### 5. `inspect()` 保持轻量输入摘要职责，不承担 OCR 预执行

`inspect()` 当前定位是输入摘要而非实际解析。为了避免在探测阶段触发高成本模型加载，本次不让 `inspect()` 预先执行 OCR，只更新它的文案与状态语义，使其反映“支持真实 OCR 编码”的能力边界。

备选方案是在 `inspect()` 中尝试预热模型或提前检测图片内容，但这会让轻量探测调用变重，也会增加接口语义复杂度，因此不采用。

### 6. 测试与 demo 都以 mock OCR 为主，避免引入脆弱的真实模型依赖

单元测试不直接依赖真实 OCR 模型文件，而是 mock `@paddlejs-models/ocr` 的入口与返回结果，覆盖以下场景：

- 正常识别出文本并映射为 `IntermediateDocument`
- 识别成功但返回空文本
- 模型或推理抛错
- 输入类型归一化仍兼容 `Blob` 与 TypedArray

demo 可以继续展示真实调用路径，但测试必须保持确定性。备选方案是直接在 Jest 中跑真实 OCR，但会依赖图形环境、模型资源和异步加载时序，不采用。

## Risks / Trade-offs

- [浏览器端模型体积与冷启动开销增加] → 通过延迟初始化 OCR 模型，将成本推迟到首次 `encode()` 调用。
- [第三方 OCR 返回结构可能不稳定] → 在适配层内部集中归一化，避免把外部字段散落到业务代码。
- [不同图片格式的 MIME 不完整或错误] → 优先使用 `Blob.type`，缺失时使用保守默认值并在解码失败时抛出明确错误。
- [OCR 坐标与 `IntermediateText` 所需字段并不完全等价] → 采用“边界框 + 默认排版”的最小可用映射策略，并在 spec 中固化最低输出要求。
- [Jest 环境缺少真实图像解码能力] → 将图像解码与 OCR 调用拆成可 mock 边界，测试只验证编排与映射逻辑。

## Migration Plan

1. 在 `package.json` 中引入 `@paddlejs-models/ocr` 及必需配套依赖。
2. 重构 `src/index.ts`，把占位编码替换为真实 OCR 编码流程，同时保留现有公开 API 形状。
3. 更新 `src/__tests__/imageParser.test.ts`，覆盖成功、空结果和失败三类核心路径。
4. 更新 `demo/demo.js`，展示真实 OCR 文本输出与错误反馈。
5. 运行测试与构建验证。

回滚策略：如果新依赖或浏览器兼容性存在问题，可回退到当前占位实现并移除新增依赖；由于未修改公开 API 形状，不涉及数据迁移。

## Open Questions

- `@paddlejs-models/ocr` 在当前打包链路下的模型资源加载方式是否需要额外静态资源配置。
- 是否需要在首版中显式限制某些图片格式（如 `svg`）只做输入接受、不承诺 OCR 成功。
- 错误类型是否需要抽象为项目内自定义错误类，还是先使用带前缀的普通 `Error` 即可。
