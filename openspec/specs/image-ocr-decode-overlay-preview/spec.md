## Purpose

定义图片 OCR 编码、解码与 Demo 覆盖层预览能力，确保 `ImageParser` 在保留原图的同时，将兼容 `@hamster-note/types@0.7.0` 的文本几何与样式语义稳定写入中间文档，并供 `decode()`、序列化链路与 Demo 预览复用。

## Requirements

### Requirement: 编码文档保留可回放原图与可复用文本语义
`ImageParser.encode()` SHALL 在生成单页 `IntermediateDocument` 时保存原始图片数据，并将 OCR 文本块的内容、页面几何、方向、竖排、旋转与样式语义写入文档，使该文档在脱离 Demo 原始文件对象后仍可被 `ImageParser.decode()`、Demo 预览与序列化链路稳定消费。

#### Scenario: 编码结果包含原图 data URL
- **WHEN** 调用方使用图片输入执行 `ImageParser.encode()` 并取得返回的 `IntermediateDocument`
- **THEN** 第一页 MUST 包含可直接加载的原图 data URL，且页面宽高 MUST 与 OCR 识别使用的图片尺寸一致

#### Scenario: 编码结果兼容新版 Text 定义
- **WHEN** 调用方在 `@hamster-note/types@0.7.0` 运行时下执行 `ImageParser.encode()`
- **THEN** 生成的每个文本块 MUST 以新版 `Text` 定义可接受的结构表达文本内容、页面几何、方向、旋转、竖排与样式语义，且 MUST 不依赖 `0.5.x` 旧版专有字段才能被后续链路消费

#### Scenario: 编码结果保留可复用几何与样式字段
- **WHEN** `ImageParser.encode()` 为图片 OCR 结果写入文本块
- **THEN** 文本块 MUST 保留供 `decode()` 与 Demo 预览直接复用的页面几何与样式语义，包括多边形或等效旋转矩形几何，以及 `fontWeight`、`italic`、`skew` 等样式字段，而不得要求下游重新依赖第三方 OCR 原始结果

#### Scenario: 样式线索不足时稳定降级
- **WHEN** OCR 多边形异常、图像采样失败或样式线索不足以稳定推断文字样式
- **THEN** 系统 MUST 继续输出文本块，并将无法稳定推断的样式字段降级为安全默认值，而不得因单个文本块放弃整个编码结果

#### Scenario: 解码不依赖上传文件对象
- **WHEN** 调用方仅持有 `ImageParser.encode()` 返回并序列化后的 `IntermediateDocument`
- **THEN** 系统 MUST 能从文档自身恢复图片来源与文本语义，以执行后续 `ImageParser.decode()` 与 Demo 预览，而不得再依赖上传阶段的原始文件对象

### Requirement: OCR poly 几何归一化为稳定文本块
`ImageParser.encode()` SHALL 将 OCR `items[].poly` 归一化为可稳定落盘的文本块几何，并将该几何写入 `IntermediateDocument`，供 `ImageParser.decode()` 与 Demo 预览直接复用。

#### Scenario: 顺时针 poly 被解释为稳定文本块几何
- **WHEN** OCR 结果提供 4 个点的 `poly`，且第 `0` 个点为左上角，其余点按顺时针表示右上、右下、左下
- **THEN** 系统 MUST 输出与该主方向一致的稳定文本块几何语义，而不得退化为无法复用的临时原始点集

#### Scenario: 轻微梯形 poly 保持稳定几何语义
- **WHEN** `poly` 的上下边或左右边存在轻微长度差异但仍表示同一文本块主方向
- **THEN** 系统 MUST 继续输出单一文本块几何语义，并保证 `ImageParser.decode()` 与 Demo 预览复用该结果时得到一致标注框

#### Scenario: 非法 poly 安全回退
- **WHEN** `poly` 点数不足、点位重复、边长过短或无法稳定判断有效四边形
- **THEN** 系统 MUST 回退到稳定的安全默认几何，而不得因单个文本块抛出额外错误，且回退结果 MUST 仍可被 `ImageParser.decode()` 与 Demo 预览消费

### Requirement: 编码结果维持解码与预览语义稳定
系统 SHALL 在 OCR 运行时迁移、序列化往返与打包产物消费后，继续输出与现有 `decode()` 和 Demo 覆盖层预览兼容的文档语义。

#### Scenario: 迁移后解码继续使用文档文本块
- **WHEN** 调用方将迁移后 `ImageParser.encode()` 生成的 `IntermediateDocument` 传入 `ImageParser.decode()`
- **THEN** 系统 MUST 仅依赖文档内已保存的图片来源和文本块语义完成标注绘制，而不得重新触发 OCR 推理或依赖新的第三方运行时输出结构

#### Scenario: Demo 预览继续复用文档坐标
- **WHEN** Demo 展示迁移后生成的 OCR 结果覆盖层预览
- **THEN** Demo MUST 使用 `IntermediateDocument` 中保存的文本块页面几何绘制覆盖层，并保持与解码结果一致的标注语义

#### Scenario: 序列化往返保留文本语义
- **WHEN** 调用方将 `ImageParser.encode()` 生成的 `IntermediateDocument` 序列化后再反序列化
- **THEN** 文本块的内容、页面几何、方向、旋转、竖排与样式语义 MUST 仍可被当前仓库的 `decode()` 与预览逻辑正确消费

#### Scenario: dist 产物消费新版文档
- **WHEN** 调用方通过仓库打包后的 dist 入口读取包含新版文本块的 `IntermediateDocument`
- **THEN** 对外产物 MUST 能与源码版本一致地消费这些文本语义，而不得出现源码可用但 dist 运行失配的情况

### Requirement: 解码输出带 OCR 标注与文本回放的图片二进制
`ImageParser.decode()` SHALL 接收包含图片来源、兼容 `@hamster-note/types@0.7.0` 的文本块几何与样式语义的 `IntermediateDocument`，在原图上绘制 OCR 标注框与文本回放，并返回可预览图片的 `ArrayBuffer`。

#### Scenario: 成功导出标注图片
- **WHEN** 调用方传入包含第一页原图与 OCR 文本块语义的 `IntermediateDocument` 执行 `ImageParser.decode()`
- **THEN** 系统 MUST 先绘制原图，再根据第一页文本块的当前页面几何绘制红色边框和对应文本回放，并返回非空 `ArrayBuffer`

#### Scenario: 标注框复用文档几何
- **WHEN** `IntermediateDocument` 第一页包含多个文本块
- **THEN** 解码结果中的每个红色边框 MUST 直接复用对应文本块在文档中的页面几何，而不得重新推导另一套 OCR 框数据

#### Scenario: 文本回放宽度对齐当前文本框
- **WHEN** `IntermediateDocument` 中的文本块包含文本内容，且其当前文本几何宽度与默认字体测量宽度不一致
- **THEN** `ImageParser.decode()` MUST 调整文本回放的绘制方式，使最终渲染文字宽度与该文本块当前宽度一致，并保持文字绘制范围不超出对应文本区域

#### Scenario: 编辑后文本宽度仍以当前文档为准
- **WHEN** 调用方在编码完成后修改了 `IntermediateDocument` 中文本块的当前宽度或等效几何
- **THEN** `ImageParser.decode()` MUST 以修改后的当前文档语义作为文本回放约束，而不得继续使用编码阶段或默认字体测量得到的旧值

#### Scenario: 新版文本方向与旋转可被消费
- **WHEN** 文档中的文本块使用 `@hamster-note/types@0.7.0` 表达方向、旋转、竖排或样式信息
- **THEN** `ImageParser.decode()` MUST 能读取这些语义并完成绘制，而不得因旧字段缺失导致解码失败或文本方向失真

#### Scenario: 解码复用文档中的样式字段
- **WHEN** `IntermediateDocument` 第一页文本块包含非默认的 `fontWeight`、`italic` 或 `skew`
- **THEN** 解码结果 MUST 直接复用这些字段控制文字渲染效果，而不得在解码阶段将它们统一回退为默认值

#### Scenario: 异常样式值可预测回退
- **WHEN** 文本块中的样式字段缺失、非数值或超出可渲染范围
- **THEN** `ImageParser.decode()` MUST 回退到安全默认样式继续渲染，避免抛出与样式字段相关的额外错误

#### Scenario: 异常坐标被限制在页面内
- **WHEN** 文本块坐标、尺寸或旋转后的边框超出页面可绘制区域
- **THEN** 系统 MUST 将标注框限制在页面边界内，避免绘制过程抛出异常或输出越界标注

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
Demo SHALL 在 OCR 处理完成后展示上传原图，并使用与 `ImageParser.decode()` 一致的文档几何语义覆盖识别到的文字区域，帮助用户在页面中直接校验 OCR 结果。

#### Scenario: 上传图片后展示原图预览
- **WHEN** 用户在 Demo 中选择图片并执行 OCR 处理
- **THEN** Demo MUST 展示该上传图片的原图预览，且预览区域最大宽度 MUST 限制为 `800px`

#### Scenario: OCR 文本区域被中间文档语义标注
- **WHEN** OCR 处理产出包含文本块页面几何的 `IntermediateDocument`
- **THEN** Demo MUST 依据该文档中的页面几何为每个文本块绘制红色覆盖层，而不得重新发起一次额外 OCR 来生成另一套坐标

#### Scenario: 样式字段不改变覆盖层几何
- **WHEN** 文本块同时包含 `skew`、`italic` 或其他文字样式字段
- **THEN** Demo 红框 MUST 仅由文档中的页面几何决定，而不得因样式字段再次改变框体几何

### Requirement: Demo 提供 Decode 结果预览
Demo SHALL 提供 `Decode` 按钮，将最近一次 OCR 处理得到的同一份 `IntermediateDocument` 直接传入 `ImageParser.decode()`，并在页面底部展示返回图片，以验证编码阶段写入的样式字段可被下游复用。

#### Scenario: 点击 Decode 展示带样式的解码图片
- **WHEN** 用户已完成 OCR 处理且中间文档包含文本块样式字段，并点击 Demo 中的 `Decode` 按钮
- **THEN** Demo MUST 调用 `ImageParser.decode()`，将返回的 `ArrayBuffer` 转换为可浏览器展示的图片 URL，并展示基于同一份中间文档导出的结果

#### Scenario: 未完成 OCR 时不能解码
- **WHEN** Demo 尚未产生可解码的 `IntermediateDocument`
- **THEN** `Decode` 操作 MUST 不调用 `ImageParser.decode()`，并且界面 MUST 避免向用户展示过期或无效的解码结果
