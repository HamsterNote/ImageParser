## ADDED Requirements

### Requirement: OCR poly 几何归一化为旋转矩形文本块
`ImageParser.encode()` SHALL 将 OCR `items[].poly` 解析为统一的旋转矩形文本块几何，并将该几何写入 `IntermediateDocument`，供 `ImageParser.decode()` 与 Demo 预览直接复用。

#### Scenario: 顺时针 poly 被解释为旋转矩形
- **WHEN** OCR 结果提供 4 个点的 `poly`，且第 `0` 个点为左上角，其余点按顺时针表示右上、右下、左下
- **THEN** 文本块的 `x` 与 `y` MUST 取左上角点，`width` MUST 取上边与下边长度的平均值，`height` MUST 取左边与右边长度的平均值，`rotate` MUST 取文本主方向角，而不得退化为轴对齐包围盒尺寸

#### Scenario: 轻微梯形 poly 保持稳定几何语义
- **WHEN** `poly` 的上下边或左右边存在轻微长度差异但仍表示同一文本块主方向
- **THEN** 系统 MUST 继续输出单一旋转矩形语义的 `width`、`height` 与 `rotate`，并保证 `ImageParser.decode()` 与 Demo 预览复用该结果时得到一致标注框

#### Scenario: 非法 poly 安全回退
- **WHEN** `poly` 点数不足、点位重复、边长过短或无法稳定判断有效四边形
- **THEN** 系统 MUST 回退到稳定的轴对齐包围盒或等效安全默认几何，而不得因单个文本块抛出额外错误，且回退结果 MUST 仍可被 `ImageParser.decode()` 与 Demo 预览消费

## MODIFIED Requirements

### Requirement: 解码输出带 OCR 标注的图片二进制
`ImageParser.decode()` SHALL 接收包含图片来源与旋转矩形文本块几何的 `IntermediateDocument`，在原图上按文档中的 `x`、`y`、`width`、`height` 与 `rotate` 绘制 OCR 标注框，并返回可预览图片的 `ArrayBuffer`。

#### Scenario: 成功导出标注图片
- **WHEN** 调用方传入包含第一页原图与 OCR 文本块旋转矩形几何的 `IntermediateDocument` 执行 `ImageParser.decode()`
- **THEN** 系统 MUST 先绘制原图，再根据第一页文本块的 `x`、`y`、`width`、`height` 与 `rotate` 绘制红色边框，并返回非空 `ArrayBuffer`

#### Scenario: 标注框复用文档旋转矩形几何
- **WHEN** `IntermediateDocument` 第一页包含多个由 OCR `poly` 归一化得到的文本块
- **THEN** 解码结果中的每个红色边框 MUST 直接复用对应文本块的 `x`、`y`、`width`、`height` 与 `rotate` 绘制，而不得重新推导另一套 `poly`、`skew` 或轴对齐框几何

#### Scenario: 异常坐标被限制在页面内
- **WHEN** 文本块坐标、尺寸或旋转后的边框超出页面可绘制区域
- **THEN** 系统 MUST 将标注框限制在页面边界内，避免绘制过程抛出异常或输出越界标注

### Requirement: Demo 展示原图 OCR 覆盖层预览
Demo SHALL 在 OCR 处理完成后展示上传原图，并使用与 `ImageParser.decode()` 一致的旋转矩形语义覆盖识别到的文字区域，帮助用户在页面中直接校验 OCR 几何。

#### Scenario: 上传图片后展示原图预览
- **WHEN** 用户在 Demo 中选择图片并执行 OCR 处理
- **THEN** Demo MUST 展示该上传图片的原图预览，且预览区域最大宽度 MUST 限制为 `800px`

#### Scenario: OCR 文本区域被旋转框标注
- **WHEN** OCR 处理产出包含文本块旋转矩形几何的 `IntermediateDocument`
- **THEN** Demo MUST 在原图预览上为每个文本块绘制与 `ImageParser.decode()` 一致的红色旋转框，且方框位置 MUST 使用文档中的 `x`、`y`、`width`、`height` 与 `rotate`

#### Scenario: 样式字段不改变红框几何
- **WHEN** 文本块同时包含 `skew`、`italic` 或其他文字样式字段
- **THEN** Demo 红框 MUST 仅由 `x`、`y`、`width`、`height` 与 `rotate` 决定，而不得因样式字段再次改变框体几何
