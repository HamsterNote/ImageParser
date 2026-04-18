## MODIFIED Requirements

### Requirement: 编码文档保留可回放原图
`ImageParser.encode()` SHALL 在生成单页 `IntermediateDocument` 时保存原始图片数据，并按照 `@hamster-note/types@0.7.0` 的 `Text` 定义写入文本块，使文档在脱离 Demo 原始文件对象后仍可被 `ImageParser.decode()`、序列化流程与预览链路稳定消费。

#### Scenario: 编码结果包含原图 data URL
- **WHEN** 调用方使用图片输入执行 `ImageParser.encode()` 并取得返回的 `IntermediateDocument`
- **THEN** 第一页 MUST 包含可直接加载的原图 data URL，且页面宽高 MUST 与 OCR 识别使用的图片尺寸一致

#### Scenario: 编码结果兼容新版 Text 定义
- **WHEN** 调用方在 `@hamster-note/types@0.7.0` 运行时下执行 `ImageParser.encode()`
- **THEN** 生成的每个文本块 MUST 以新版 `Text` 定义可接受的结构表达文本内容、页面几何、方向、旋转、竖排与样式语义，且 MUST 不依赖 `0.5.x` 旧版专有字段才能被后续链路消费

#### Scenario: 解码不依赖上传文件对象
- **WHEN** 调用方仅持有 `ImageParser.encode()` 返回并序列化后的 `IntermediateDocument`
- **THEN** 系统 MUST 能从文档自身恢复图片来源与新版文本语义，以执行后续 `ImageParser.decode()`

### Requirement: 解码输出带 OCR 标注的图片二进制
`ImageParser.decode()` SHALL 接收包含图片来源与符合 `@hamster-note/types@0.7.0` `Text` 定义的 `IntermediateDocument`，在原图上绘制 OCR 标注框，并返回可预览图片的 `ArrayBuffer`。

#### Scenario: 成功导出标注图片
- **WHEN** 调用方传入包含第一页原图与可表达文本几何语义的 `IntermediateDocument` 执行 `ImageParser.decode()`
- **THEN** 系统 MUST 先绘制原图，再根据第一页文本块的页面坐标与尺寸绘制红色边框，并返回非空 `ArrayBuffer`

#### Scenario: 标注框使用文档坐标
- **WHEN** `IntermediateDocument` 第一页包含多个 OCR 文本块
- **THEN** 解码结果中的每个红色边框 MUST 使用对应文本块在文档中的页面坐标与尺寸绘制，而不得回退为依赖旧版 `Text` 字段名重新推导另一套 OCR 框数据

#### Scenario: 新版文本方向与旋转可被消费
- **WHEN** 文档中的文本块使用 `@hamster-note/types@0.7.0` 表达方向、旋转、竖排或样式信息
- **THEN** `ImageParser.decode()` MUST 能读取这些语义并完成绘制，而不得因旧字段缺失导致解码失败或文本方向失真

#### Scenario: 异常坐标被限制在页面内
- **WHEN** 文本块坐标或尺寸超出页面可绘制区域
- **THEN** 系统 MUST 将标注框裁剪到页面边界内，避免绘制过程抛出异常或输出越界标注

### Requirement: Demo 展示原图 OCR 覆盖层预览
Demo SHALL 在 OCR 处理完成后展示上传原图，并使用兼容 `@hamster-note/types@0.7.0` 文本语义的红色方框覆盖识别到的文字区域，帮助用户在页面中直接校验 OCR 坐标。

#### Scenario: 上传图片后展示原图预览
- **WHEN** 用户在 Demo 中选择图片并执行 OCR 处理
- **THEN** Demo MUST 展示该上传图片的原图预览，且预览区域最大宽度 MUST 限制为 `800px`

#### Scenario: OCR 文本区域被红框标注
- **WHEN** OCR 处理产出包含新版文本定义兼容几何语义的 `IntermediateDocument`
- **THEN** Demo MUST 在原图预览上为每个文本块绘制红色方框，且方框位置 MUST 与中间文档中的页面坐标一致

## ADDED Requirements

### Requirement: 新版文本块支持稳定序列化互操作
系统 SHALL 确保 `ImageParser.encode()` 产出的新版文本块在序列化、反序列化与打包产物互操作后，仍保有 `decode()` 与预览所需的关键语义。

#### Scenario: 序列化往返保留文本语义
- **WHEN** 调用方将 `ImageParser.encode()` 生成的 `IntermediateDocument` 序列化后再反序列化
- **THEN** 文本块的内容、页面几何、方向、旋转、竖排与样式语义 MUST 仍可被当前仓库的 `decode()` 与预览逻辑正确消费

#### Scenario: dist 产物消费新版文档
- **WHEN** 调用方通过仓库打包后的 dist 入口读取包含新版文本块的 `IntermediateDocument`
- **THEN** 对外产物 MUST 能与源码版本一致地消费这些文本语义，而不得出现源码可用但 dist 运行失配的情况
