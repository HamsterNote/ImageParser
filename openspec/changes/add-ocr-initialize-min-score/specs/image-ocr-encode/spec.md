## MODIFIED Requirements

### Requirement: 图片输入执行 OCR 编码
`ImageParser.encode()` SHALL 接受 `Blob`、`ArrayBuffer` 与 `ArrayBufferView` 形式的图片输入，并对单张图片执行 OCR 编码，返回可被 Hamster Note 消费的 `IntermediateDocument`。`ImageParser.encode()` SHALL 支持可选的第二参数 `options?: { minScore?: number }`，当 `options` 缺省或未指定 `minScore` 时，编码语义 MUST 与未引入该参数前完全一致。

#### Scenario: 可解码图片输入被成功识别
- **WHEN** 调用方传入可解码的单张图片，且 OCR 成功识别出文字
- **THEN** 系统 MUST 返回 `pageCount` 为 1 的 `IntermediateDocument`，且第一页 MUST 包含至少一个识别出的文本项

#### Scenario: 不同输入载体保持一致编码语义
- **WHEN** 调用方分别以 `Blob`、`ArrayBuffer` 或 `ArrayBufferView` 传入同类图片数据
- **THEN** 系统 MUST 对这些输入执行一致的 OCR 编码语义，而不得因输入载体不同退回占位实现或拒绝处理

#### Scenario: 未传入 options 保持既有语义
- **WHEN** 调用方仅以 `encode(input)` 形式调用，未提供 `options` 或未指定 `minScore`
- **THEN** 系统 MUST 保留全部 OCR 文本项，不对置信度进行任何过滤，且 MUST 与未引入 `options` 参数前的输出语义完全一致

## ADDED Requirements

### Requirement: 调用方触发的 OCR 运行时预初始化
`ImageParser` SHALL 提供由调用方显式触发的 `initialize()` 方法，使调用方能够在首次编码前提前完成 PaddleOCR 运行时加载，且该方法 MUST 复用现有 OCR 运行时单例缓存而不引入新缓存。`ImageParser.initialize()` 与实例 `parser.initialize()` MUST 返回 `Promise<void>`，MUST NOT 返回 OCR 实例，MUST NOT 接受任何配置参数。`ImageParser` MUST NOT 在模块 `import` 阶段或类构造函数中自动触发 OCR 初始化；OCR 运行时加载只能由 `initialize()` 或首次 `encode()` 显式触发。

#### Scenario: 显式调用 initialize 完成运行时加载
- **WHEN** 调用方在任何 `encode()` 之前调用 `ImageParser.initialize()` 或实例 `parser.initialize()`
- **THEN** 系统 MUST 触发内部 PaddleOCR 运行时加载流程，并在 Promise resolve 后保持 OCR 运行时处于已缓存可复用状态
- **AND** 返回值 MUST 是 `Promise<void>`，MUST NOT 暴露底层 OCR 实例或第三方运行时对象

#### Scenario: import 与 constructor 不自动初始化
- **WHEN** 调用方仅完成 `ImageParser` 模块的 import 或仅 `new ImageParser()`，但未调用 `initialize()` 或 `encode()`
- **THEN** 系统 MUST NOT 触发 PaddleOCR 运行时加载或 `PaddleOCR.create()` 调用

#### Scenario: 并发 initialize 复用同一加载流程
- **WHEN** 调用方在同一时刻并发触发多次 `initialize()`（例如 `Promise.all([ImageParser.initialize(), ImageParser.initialize()])`）
- **THEN** 系统 MUST 仅触发一次底层 OCR 运行时创建，并让所有并发调用共享同一个加载结果

#### Scenario: initialize 与首次 encode 共享缓存
- **WHEN** 调用方先成功完成 `ImageParser.initialize()`，随后再调用 `ImageParser.encode(input)`
- **THEN** 系统 MUST 直接复用 `initialize()` 创建的 OCR 运行时实例，而不得在 `encode()` 阶段重复触发 OCR 运行时创建

#### Scenario: 失败 initialize 清空缓存并允许重试
- **WHEN** `ImageParser.initialize()` 在加载或创建 OCR 运行时过程中失败
- **THEN** 系统 MUST 清空已缓存的 OCR 运行时状态，并向调用方抛出明确错误
- **AND** 后续的 `ImageParser.initialize()` 或 `ImageParser.encode()` 调用 MUST 能够重新触发 OCR 运行时创建以完成重试

### Requirement: encode 支持基于 minScore 的置信度过滤
当调用方为 `ImageParser.encode(input, options)` 显式传入合法的 `options.minScore` 时，系统 SHALL 在 raw OCR 结果边界过滤低置信度文本项：仅保留 `score >= minScore` 的文本项，且当文本项 `score` 缺失、为 `NaN` 或非有限数字时同样丢弃。过滤 MUST 在原始 OCR 结果归一化为内部文本块之前完成，且 MUST NOT 将 `score` 字段写入归一化文本块、`IntermediateText` 或 `IntermediateDocument` 等下游文档结构。

#### Scenario: minScore 保留边界相等的文本项
- **WHEN** 调用方调用 `ImageParser.encode(input, { minScore: 0.8 })`，且某个 OCR 文本项的 `score` 等于 `0.8`
- **THEN** 系统 MUST 将该文本项保留到生成的 `IntermediateDocument` 中

#### Scenario: minScore 丢弃低于阈值的文本项
- **WHEN** 调用方调用 `ImageParser.encode(input, { minScore: 0.8 })`，且某个 OCR 文本项的 `score` 小于 `0.8`
- **THEN** 系统 MUST 在归一化为内部文本块之前丢弃该文本项，使其不会出现在最终 `IntermediateDocument` 中

#### Scenario: minScore 设置时丢弃缺失或非有限 score 的文本项
- **WHEN** 调用方调用 `ImageParser.encode(input, { minScore })` 且 `minScore` 为合法值，但某个 OCR 文本项的 `score` 缺失、为 `NaN`、`Infinity` 或其他非有限数字
- **THEN** 系统 MUST 丢弃该文本项，而不得将其写入归一化文本块或下游 `IntermediateDocument`

#### Scenario: minScore 仅作用于过滤不写入下游文档
- **WHEN** 调用方使用 `minScore` 过滤后获得 `IntermediateDocument`
- **THEN** 文档中的文本项 MUST NOT 包含 `score` 字段，归一化文本块结构与既有解码/预览链路消费方式 MUST 保持不变

### Requirement: 非法 minScore 在 OCR 与图片解码之前 fail-fast
当 `options.minScore` 不是有限数字、小于 `0` 或大于 `1` 时，`ImageParser.encode()` MUST 抛出明确错误。该校验 MUST 在任何 OCR 运行时初始化、`PaddleOCR.create()` 调用以及图片解码之前完成，以保证非法参数不会触发底层资源加载或副作用。

#### Scenario: 非有限 minScore 立即抛错
- **WHEN** 调用方调用 `ImageParser.encode(input, { minScore })` 且 `minScore` 为 `NaN`、`Infinity`、`-Infinity` 或非 `number` 类型
- **THEN** 系统 MUST 抛出明确错误
- **AND** 系统 MUST NOT 触发 OCR 运行时加载、`PaddleOCR.create()` 调用或图片解码流程

#### Scenario: 越界 minScore 立即抛错
- **WHEN** 调用方调用 `ImageParser.encode(input, { minScore })` 且 `minScore` 小于 `0` 或大于 `1`
- **THEN** 系统 MUST 抛出明确错误
- **AND** 系统 MUST NOT 触发 OCR 运行时加载、`PaddleOCR.create()` 调用或图片解码流程

#### Scenario: 合法 minScore 边界值 0 与 1 通过校验
- **WHEN** 调用方调用 `ImageParser.encode(input, { minScore: 0 })` 或 `ImageParser.encode(input, { minScore: 1 })`
- **THEN** 系统 MUST 通过参数校验并继续执行 OCR 编码流程
