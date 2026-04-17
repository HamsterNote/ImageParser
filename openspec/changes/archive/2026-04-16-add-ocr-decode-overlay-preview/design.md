## Context

`ImageParser.encode()` 目前已经能把图片 OCR 结果转换为单页 `IntermediateDocument`，但中间文档只保留了页面尺寸与文本块坐标，没有保留任何可回放的原图数据，因此 `ImageParser.decode()` 无法仅凭 `IntermediateDocument` 重新生成带标注的图片。

本次变更要补齐两条链路：

- 解析侧：让 `encode()` 产出的中间文档保留足够的原图信息，支撑后续 `decode()`。
- 展示侧：在 Demo 中同时展示原图标注预览与 `decode()` 输出结果，帮助校验 OCR 坐标是否正确。

受影响范围：

- `src/index.ts`：扩展 encode/decode 的内部编排与渲染能力。
- `src/__tests__/imageParser.test.ts`：补齐 decode、原图回放和覆盖层导出相关测试。
- `demo/demo.js`、`demo/inspect.html`、`demo/demo.css`：增加原图标注预览区、Decode 按钮与结果展示。

当前约束：

- 公开接口形状不变，`decode()` 仍只接收 `IntermediateDocument`。
- `@hamster-note/types` 当前没有专门的背景图字段，页面可持久化的图片相关字段只有 `thumbnail: string | undefined`。
- Demo 与 decode 都运行在浏览器环境，可依赖 `Image`、`canvas`、`Blob`、`URL.createObjectURL` 等 Web API。

## Goals / Non-Goals

**Goals:**

- 让 `ImageParser.encode()` 生成的单页文档具备“可解码回图片”的最小必要信息。
- 实现 `ImageParser.decode()`，输出包含 OCR 红色框标注的图片二进制结果。
- 保持 OCR 文本坐标与 decode 标注使用同一份版面数据，避免 Demo 和库内各自重复推导框信息。
- 在 Demo 中展示上传原图、红框覆盖层和 decode 输出图，便于肉眼验证结果。
- 为失败场景提供可诊断错误，例如文档缺少原图、浏览器缺少画布导出能力等。

**Non-Goals:**

- 不扩展 `IntermediateDocument` / `IntermediatePage` 的上游类型定义。
- 不追求像素级文本重绘或复杂版面恢复，本次只绘制边框，不回写文字内容。
- 不支持多页图片、批量 decode 或服务端无 DOM 环境下的渲染。
- 不在本次引入新的持久化存储来保存原图资源。

## Decisions

### 1. 使用 `IntermediatePage.thumbnail` 持久化原图数据，而不是新增自定义文档结构

`decode()` 只有 `IntermediateDocument` 入参，若不在 encode 阶段把原图带入中间文档，就无法回放原始图片。当前 `IntermediatePage` 唯一可序列化且适合承载图片字符串的字段是 `thumbnail`，因此本次选择把原图保存为 data URL 写入页面 `thumbnail`。

这样做的原因：

- 不需要修改 `@hamster-note/types`，兼容现有序列化/反序列化流程。
- Demo 与调用方在拿到序列化后的 `IntermediateDocument` 后，依然可以直接做 `decode()`。
- 单图单页场景下，使用 data URL 的实现成本最低，且不依赖外部资源管理。

备选方案：

- **把原图二进制塞进 `title` 或文本节点扩展字段**：语义混乱，后续维护困难，不采用。
- **引入外部资源 ID + 资源仓库**：更适合大型系统，但超出当前库的职责边界，不采用。
- **只在 Demo 内保留原图文件，不写入文档**：会导致 `decode()` 无法脱离 Demo 独立工作，不采用。

### 2. `encode()` 与 `decode()` 共享同一套“页面几何信息”约定

`encode()` 已经把 OCR 文本块映射为 `IntermediateText`，其中 `x`、`y`、`width`、`height` 足以表达覆盖框位置。本次不再为 decode 额外维护一份 box 数据，而是约定：decode 直接读取第一页的 `IntermediateText[]` 作为覆盖层来源。

这样做的原因：

- 保证 encode、decode、Demo 预览三处都基于同一份坐标语义，避免一处改动另一处漂移。
- 减少重复状态，降低“原始 points、归一化 box、页面 text”三套数据不一致的风险。

备选方案是把原始 OCR points 另存到自定义元数据中，再由 decode 单独使用，但这会增加额外状态同步成本，不采用。

### 3. `decode()` 采用浏览器 Canvas 渲染路径：先画原图，再画红框，最后导出 `ArrayBuffer`

`decode()` 的输出目标是可预览图片二进制，因此最直接的路径是：

1. 从第一页 `thumbnail` 读取 data URL 并解码为 `HTMLImageElement`。
2. 以页面宽高创建画布，先绘制原图。
3. 遍历文本块绘制红色描边框；边框宽度按页面尺寸做保守缩放，保证大图与小图都可见。
4. 使用 `canvas.toBlob()` 导出与原图 MIME 一致或回退为 `image/png` 的图片，再转成 `ArrayBuffer` 返回。

这样做的原因：

- 浏览器画布天然适合“底图 + 覆盖层 + 二进制导出”的组合需求。
- 结果可以直接被 Demo 或调用方转成 Blob URL 预览。
- 不需要引入额外绘图库或 SVG 组装逻辑。

备选方案：

- **输出 SVG 字符串**：可读性强，但当前 `decode()` 约定返回 `ParserInput`，还要额外处理 MIME 与浏览器兼容，不采用。
- **只在 Demo 中用 HTML/CSS 覆盖框，不在库中实现 decode**：无法满足库能力要求，不采用。

### 4. 原图 MIME 继续从 encode 阶段推导，并与页面图像数据一起保留

当前 `encode()` 已有 MIME 推导逻辑，但 decode 阶段不能只依赖 `document.title` 这种非结构化字符串。实现上会在生成 data URL 时自然包含 MIME 前缀，decode 导出时优先复用该 MIME；若画布导出不支持对应格式，则统一回退到 `image/png`。

这样做的原因：

- 避免再次解析非结构化标题文本。
- Data URL 本身就是完整的图片来源描述，便于调试和回放。
- PNG 回退在浏览器端兼容性最好。

备选方案是额外编码一份 MIME 元数据，但在已有 data URL 的前提下没有必要，不采用。

### 5. Demo 分成“原图标注预览”和“decode 结果预览”两个层次

Demo 不应只展示 decode 的最终图，因为那会掩盖“中间文档坐标是否正确”和“decode 渲染是否正确”这两类问题。界面上拆成两个视觉层次：

- **原图标注预览**：直接基于上传图片与中间文档坐标，在页面上叠加红框，最大宽度限制为 `800px`，用于即时校验 OCR 坐标。
- **decode 结果预览**：点击 `Decode` 后，展示由库返回的最终图片，验证导出链路正确。

这样做可以把“坐标问题”和“导出问题”分开定位。备选方案是只保留 decode 结果区，但问题定位粒度太粗，不采用。

### 6. 测试以可控 mock 为主，覆盖“文档可回放”和“导出失败”两类新增边界

现有测试已 mock `Image` 与 `URL.createObjectURL`，本次继续沿用该策略，并补充画布替身，验证以下行为：

- `encode()` 产出的第一页包含可回放原图数据。
- `decode()` 会读取页面图片、绘制红框并返回二进制结果。
- 当文档缺少 `thumbnail`、画布上下文为空或 `toBlob()` 失败时，抛出明确错误。
- Demo 相关逻辑仍以 DOM 行为测试或最小单元函数测试为主，不依赖真实 OCR 模型和真实画布渲染。

备选方案是引入真实 canvas 环境或截图比对，但对当前仓库来说成本过高且稳定性不足，不采用。

## Risks / Trade-offs

- [把原图保存到 `thumbnail` 会增大序列化文档体积] → 当前仅支持单页图片场景，先接受体积换能力；后续若扩展多页再评估资源外置。
- [`thumbnail` 语义从“缩略图”扩展为“原图 data URL”可能让命名显得不够准确] → 在实现与 spec 中明确这是当前类型约束下的兼容性承载方案。
- [浏览器对 `canvas.toBlob()` 的格式支持不完全一致] → 优先复用原图 MIME，不支持时统一回退为 `image/png`。
- [文本块坐标可能超出页面尺寸或出现异常值] → decode 前对坐标做边界裁剪，避免描边时抛错或绘制出界。
- [Demo 里同时维护页面叠层预览与 decode 结果，存在重复展示成本] → 把叠层数据来源统一收敛到中间文档文本框，避免两套坐标逻辑分叉。

## Migration Plan

1. 在 `src/index.ts` 中补充原图转 data URL、页面图片恢复、Canvas 导出与红框绘制辅助函数。
2. 调整 `encode()`，在构建 `IntermediatePage` 时写入页面 `thumbnail`，保留原图可回放能力。
3. 实现 `ImageParser.decode()`，读取第一页图像与文本框后导出标注图。
4. 更新 Demo，新增原图预览区、Decode 按钮、decode 结果展示区与对应状态管理。
5. 更新测试，覆盖 encode/decode 新增成功与失败路径。
6. 运行测试与构建验证。

回滚策略：若 `thumbnail` 持久化原图导致体积或兼容性问题，可回退到当前“仅 encode、无 decode”的实现；因为未修改公开 API 形状，不涉及数据迁移，只需移除新增渲染逻辑与测试。

## Open Questions

- `thumbnail` 保存完整 data URL 是否会影响下游依赖 `getCover()` 的展示性能；若影响明显，后续是否需要同时保存缩略图与原图引用。
- Demo 的原图标注预览是使用 `<canvas>` 统一绘制，还是使用 DOM 绝对定位红框覆盖层；两者都能满足需求，但前者更接近 decode，后者更易调试。
- `decode()` 返回值是否应始终归一为 `image/png`，从而避免不同浏览器对 JPEG/WebP 导出差异带来的不确定性。
