## Purpose

定义 `ImageParser` 对图片输入执行 OCR 编码的行为，确保系统能够从单张图片产出可被 Hamster Note 消费的 `IntermediateDocument`，并对空识别结果与异常分支给出可诊断反馈。

## Requirements

### Requirement: 图片输入执行 OCR 编码
`ImageParser.encode()` SHALL 接受 `Blob`、`ArrayBuffer` 与 `ArrayBufferView` 形式的图片输入，并对单张图片执行 OCR 编码，返回可被 Hamster Note 消费的 `IntermediateDocument`。

#### Scenario: 可解码图片输入被成功识别
- **WHEN** 调用方传入可解码的单张图片，且 OCR 成功识别出文字
- **THEN** 系统 MUST 返回 `pageCount` 为 1 的 `IntermediateDocument`，且第一页 MUST 包含至少一个识别出的文本项

#### Scenario: 不同输入载体保持一致编码语义
- **WHEN** 调用方分别以 `Blob`、`ArrayBuffer` 或 `ArrayBufferView` 传入同类图片数据
- **THEN** 系统 MUST 对这些输入执行一致的 OCR 编码语义，而不得因输入载体不同退回占位实现或拒绝处理

### Requirement: OCR 结果映射为基础版面信息
系统 SHALL 将 OCR 返回的文字块映射为单页 `IntermediateDocument` 中的 `IntermediateText` 集合，并保留后续消费所需的基础版面信息。

#### Scenario: 页面尺寸继承原图尺寸
- **WHEN** 系统完成图片解码并构建中间文档
- **THEN** 返回页面的宽度与高度 MUST 与原始图片尺寸一致

#### Scenario: 文本块包含基础定位字段
- **WHEN** OCR 返回文本内容与边界框信息
- **THEN** 每个生成的文本项 MUST 包含文本内容以及 `x`、`y`、`width`、`height` 等基础定位字段

### Requirement: 空识别结果返回合法空文档
系统 SHALL 将“识别成功但没有任何文字”视为正常结果，并返回合法的空文本文档，而不是抛出异常。

#### Scenario: OCR 成功但无文字
- **WHEN** OCR 执行成功但未识别到任何文本块
- **THEN** 系统 MUST 返回包含单页且 `texts` 为空的 `IntermediateDocument`

### Requirement: 识别失败提供明确错误反馈
系统 SHALL 在模型加载失败、图片解码失败或 OCR 推理失败时抛出明确异常，使调用方可以与空识别结果区分。

#### Scenario: OCR 链路执行失败
- **WHEN** 图片无法解码、OCR 模型不可用或推理过程抛出错误
- **THEN** 系统 MUST 抛出错误，而不得返回占位文档或伪造的成功结果

### Requirement: 探测接口保持轻量摘要
`ImageParser.inspect()` SHALL 保持轻量输入摘要职责，不得为了探测而预先执行 OCR，但其返回结果 MUST 反映系统已支持真实图片 OCR 编码。

#### Scenario: 调用 inspect 获取输入摘要
- **WHEN** 调用方仅调用 `inspect()` 检查图片输入
- **THEN** 系统 MUST 返回输入类型、字节大小与支持信息，并明确该输入支持真实 OCR 编码，且不得触发真实 OCR 执行
