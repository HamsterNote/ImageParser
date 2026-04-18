## MODIFIED Requirements

### Requirement: 解码输出带 OCR 标注的图片二进制
`ImageParser.decode()` SHALL 接收包含图片来源、文本内容与文本框坐标的 `IntermediateDocument`，在原图上绘制 OCR 标注框与文本回放，并返回可预览图片的 `ArrayBuffer`。

#### Scenario: 成功导出标注图片
- **WHEN** 调用方传入包含第一页原图与 OCR 文本块坐标的 `IntermediateDocument` 执行 `ImageParser.decode()`
- **THEN** 系统 MUST 先绘制原图，再根据第一页文本块的 `x`、`y`、`width` 与 `height` 绘制红色边框和对应文本回放，并返回非空 `ArrayBuffer`

#### Scenario: 标注框使用文档坐标
- **WHEN** `IntermediateDocument` 第一页包含多个 OCR 文本块
- **THEN** 解码结果中的每个红色边框 MUST 使用对应文本块的页面坐标与尺寸绘制，而不得重新推导另一套 OCR 框数据

#### Scenario: 文本回放宽度对齐当前文本框
- **WHEN** `IntermediateDocument` 中的文本块包含文本内容，且其当前 `width` 与默认字体测量宽度不一致
- **THEN** `ImageParser.decode()` MUST 调整文本回放的绘制方式，使最终渲染文字宽度与该文本块当前 `width` 一致，并保持文字绘制范围不超出对应文本区域

#### Scenario: 编辑后文本宽度仍以当前文档为准
- **WHEN** 调用方在编码完成后修改了 `IntermediateDocument` 中文本块的 `width`
- **THEN** `ImageParser.decode()` MUST 以修改后的当前 `width` 作为文本回放宽度约束，而不得继续使用编码阶段或默认字体测量得到的旧宽度

#### Scenario: 异常坐标被限制在页面内
- **WHEN** 文本块坐标或尺寸超出页面可绘制区域
- **THEN** 系统 MUST 将标注框裁剪到页面边界内，避免绘制过程抛出异常或输出越界标注
