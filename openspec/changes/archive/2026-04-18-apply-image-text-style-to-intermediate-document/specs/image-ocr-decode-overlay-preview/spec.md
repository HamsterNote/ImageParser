## MODIFIED Requirements

### Requirement: 编码文档保留可回放原图
`ImageParser.encode()` SHALL 在生成单页 `IntermediateDocument` 时保存原始图片数据，并将每个 OCR 文本块的内容、坐标与可复用的文字样式字段一并写入文档，使该文档在脱离 Demo 原始文件对象后仍可被 `ImageParser.decode()` 与 Demo 预览链路复用。

#### Scenario: 编码结果包含原图 data URL
- **WHEN** 调用方使用图片输入执行 `ImageParser.encode()` 并取得返回的 `IntermediateDocument`
- **THEN** 第一页 MUST 包含可直接加载的原图 data URL，且页面宽高 MUST 与 OCR 识别使用的图片尺寸一致

#### Scenario: 解码不依赖上传文件对象
- **WHEN** 调用方仅持有 `ImageParser.encode()` 返回并序列化后的 `IntermediateDocument`
- **THEN** 系统 MUST 能从文档自身恢复图片来源以执行后续 `ImageParser.decode()` 与 Demo 预览，而不得再依赖上传阶段的原始文件对象

#### Scenario: 文本块保留可复用样式字段
- **WHEN** `ImageParser.encode()` 为图片 OCR 结果写入文本块
- **THEN** 每个文本块 MUST 与页面坐标一起保留 `fontWeight`、`italic`、`rotate` 与 `skew` 字段，供后续 `decode` 与 Demo 预览链路直接复用

#### Scenario: 样式线索不足时稳定降级
- **WHEN** OCR 多边形异常、图像采样失败或样式线索不足以稳定推断文字样式
- **THEN** 系统 MUST 继续输出文本块，并将无法稳定推断的样式字段降级为 `fontWeight: 400`、`italic: false`、`rotate: 0` 与 `skew: 0`

### Requirement: 解码输出带 OCR 标注的图片二进制
`ImageParser.decode()` SHALL 接收包含文本块坐标与文字样式字段的 `IntermediateDocument`，基于文档中的 `fontWeight`、`italic`、`rotate` 与 `skew` 渲染导出图片，而不得重新推导另一套样式协议。

#### Scenario: 成功导出带样式文本的图片
- **WHEN** 调用方传入包含第一页文本块坐标与样式字段的 `IntermediateDocument` 执行 `ImageParser.decode()`
- **THEN** 系统 MUST 使用文档中每个文本块的内容、位置和样式绘制导出结果，并返回非空 `ArrayBuffer`

#### Scenario: 解码复用文档中的样式字段
- **WHEN** `IntermediateDocument` 第一页文本块包含非默认的 `fontWeight`、`italic`、`rotate` 或 `skew`
- **THEN** 解码结果 MUST 直接复用这些字段控制文字渲染效果，而不得在解码阶段将它们统一回退为默认值

#### Scenario: 异常样式值可预测回退
- **WHEN** 文本块中的样式字段缺失、非数值或超出可渲染范围
- **THEN** `ImageParser.decode()` MUST 回退到安全默认样式继续渲染，避免抛出与样式字段相关的额外错误

### Requirement: Demo 展示原图 OCR 覆盖层预览
Demo SHALL 在 OCR 处理完成后展示上传原图，并基于最新 `IntermediateDocument` 中的文本块坐标绘制覆盖层预览，帮助用户直接校验文档落盘后的 OCR 结果。

#### Scenario: 上传图片后展示原图预览
- **WHEN** 用户在 Demo 中选择图片并执行 OCR 处理
- **THEN** Demo MUST 展示该上传图片的原图预览，且预览区域最大宽度 MUST 限制为 `800px`

#### Scenario: OCR 文本区域被中间文档坐标标注
- **WHEN** OCR 处理产出包含文本块坐标的 `IntermediateDocument`
- **THEN** Demo MUST 依据该文档中的页面坐标为每个文本块绘制红色方框，而不得重新发起一次额外 OCR 来生成另一套覆盖层坐标

### Requirement: Demo 提供 Decode 结果预览
Demo SHALL 提供 `Decode` 按钮，将最近一次 OCR 处理得到的同一份 `IntermediateDocument` 直接传入 `ImageParser.decode()`，并在页面底部展示返回图片，以验证编码阶段写入的样式字段可被下游复用。

#### Scenario: 点击 Decode 展示带样式的解码图片
- **WHEN** 用户已完成 OCR 处理且中间文档包含文本块样式字段，并点击 Demo 中的 `Decode` 按钮
- **THEN** Demo MUST 调用 `ImageParser.decode()`，将返回的 `ArrayBuffer` 转换为可浏览器展示的图片 URL，并展示基于同一份中间文档导出的结果

#### Scenario: 未完成 OCR 时不能解码
- **WHEN** Demo 尚未产生可解码的 `IntermediateDocument`
- **THEN** `Decode` 操作 MUST 不调用 `ImageParser.decode()`，并且界面 MUST 避免向用户展示过期或无效的解码结果
