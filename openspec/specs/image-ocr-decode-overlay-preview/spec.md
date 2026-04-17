## Purpose

定义图片 OCR 编码、解码与 Demo 覆盖层预览能力，确保 `ImageParser` 可保留原图、回放 OCR 标注并向用户展示可校验的识别坐标。

## Requirements

### Requirement: 编码文档保留可回放原图
`ImageParser.encode()` SHALL 在生成单页 `IntermediateDocument` 时保存原始图片数据，使该文档在脱离 Demo 原始文件对象后仍可被 `ImageParser.decode()` 渲染为标注图片。

#### Scenario: 编码结果包含原图 data URL
- **WHEN** 调用方使用图片输入执行 `ImageParser.encode()` 并取得返回的 `IntermediateDocument`
- **THEN** 第一页 MUST 包含可直接加载的原图 data URL，且页面宽高 MUST 与 OCR 识别使用的图片尺寸一致

#### Scenario: 解码不依赖上传文件对象
- **WHEN** 调用方仅持有 `ImageParser.encode()` 返回并序列化后的 `IntermediateDocument`
- **THEN** 系统 MUST 能从文档自身恢复图片来源以执行后续 `ImageParser.decode()`

### Requirement: 解码输出带 OCR 标注的图片二进制
`ImageParser.decode()` SHALL 接收包含图片来源与文本框坐标的 `IntermediateDocument`，在原图上绘制 OCR 标注框，并返回可预览图片的 `ArrayBuffer`。

#### Scenario: 成功导出标注图片
- **WHEN** 调用方传入包含第一页原图与 OCR 文本块坐标的 `IntermediateDocument` 执行 `ImageParser.decode()`
- **THEN** 系统 MUST 先绘制原图，再根据第一页文本块的 `x`、`y`、`width` 与 `height` 绘制红色边框，并返回非空 `ArrayBuffer`

#### Scenario: 标注框使用文档坐标
- **WHEN** `IntermediateDocument` 第一页包含多个 OCR 文本块
- **THEN** 解码结果中的每个红色边框 MUST 使用对应文本块的页面坐标与尺寸绘制，而不得重新推导另一套 OCR 框数据

#### Scenario: 异常坐标被限制在页面内
- **WHEN** 文本块坐标或尺寸超出页面可绘制区域
- **THEN** 系统 MUST 将标注框裁剪到页面边界内，避免绘制过程抛出异常或输出越界标注

### Requirement: 解码失败可诊断
`ImageParser.decode()` SHALL 对无法恢复原图或无法完成画布导出的情况提供明确错误，避免静默返回无效结果。

#### Scenario: 文档缺少原图数据
- **WHEN** 调用方传入的 `IntermediateDocument` 第一页缺少可加载原图数据
- **THEN** `ImageParser.decode()` MUST 拒绝解码并抛出说明缺少页面图片来源的错误

#### Scenario: 画布上下文不可用
- **WHEN** 浏览器无法提供可用的二维画布上下文
- **THEN** `ImageParser.decode()` MUST 抛出说明画布初始化失败的错误

#### Scenario: 图片导出失败
- **WHEN** 画布无法导出图片 Blob 或导出结果为空
- **THEN** `ImageParser.decode()` MUST 抛出说明图片导出失败的错误

### Requirement: Demo 展示原图 OCR 覆盖层预览
Demo SHALL 在 OCR 处理完成后展示上传原图，并使用红色方框覆盖识别到的文字区域，帮助用户在页面中直接校验 OCR 坐标。

#### Scenario: 上传图片后展示原图预览
- **WHEN** 用户在 Demo 中选择图片并执行 OCR 处理
- **THEN** Demo MUST 展示该上传图片的原图预览，且预览区域最大宽度 MUST 限制为 `800px`

#### Scenario: OCR 文本区域被红框标注
- **WHEN** OCR 处理产出包含文本块坐标的 `IntermediateDocument`
- **THEN** Demo MUST 在原图预览上为每个文本块绘制红色方框，且方框位置 MUST 与中间文档中的页面坐标一致

### Requirement: Demo 提供 Decode 结果预览
Demo SHALL 提供 `Decode` 按钮，将最近一次 OCR 处理得到的 `IntermediateDocument` 传入 `ImageParser.decode()`，并在页面底部展示返回图片。

#### Scenario: 点击 Decode 展示解码图片
- **WHEN** 用户已完成 OCR 处理并点击 Demo 中的 `Decode` 按钮
- **THEN** Demo MUST 调用 `ImageParser.decode()`，将返回的 `ArrayBuffer` 转换为可浏览器展示的图片 URL，并在页面底部显示解码结果

#### Scenario: 未完成 OCR 时不能解码
- **WHEN** Demo 尚未产生可解码的 `IntermediateDocument`
- **THEN** `Decode` 操作 MUST 不调用 `ImageParser.decode()`，并且界面 MUST 避免向用户展示过期或无效的解码结果
