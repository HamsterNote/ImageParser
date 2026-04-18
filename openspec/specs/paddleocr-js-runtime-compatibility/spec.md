## Purpose

定义 `@paddleocr/paddleocr-js` 在浏览器端接入 `ImageParser` 时的运行时约束，确保 OCR 实例初始化、结果归一化、失败恢复与默认配置在不改变公开 API 的前提下保持稳定可用。

## Requirements

### Requirement: 浏览器端 OCR 运行时受控初始化
系统 SHALL 在浏览器端通过 `@paddleocr/paddleocr-js` 的受控适配层完成 OCR 运行时创建，并在不改变 `ImageParser.encode()` 对外调用方式的前提下复用已创建实例。

#### Scenario: 首次编码创建并缓存 OCR 实例
- **WHEN** 调用方首次使用图片输入执行 `ImageParser.encode()`
- **THEN** 系统 MUST 在内部调用 `PaddleOCR.create()` 创建 OCR 实例，并在后续编码请求中复用该实例，而不得为每次识别重复初始化运行时

#### Scenario: 调用方无需感知第三方生命周期
- **WHEN** 调用方继续使用现有 `ImageParser.encode()` API 发起图片 OCR
- **THEN** 系统 MUST 在内部完成运行时加载、实例创建与后续复用，而不得要求调用方直接传入 `create`、`predict` 或 `dispose` 相关第三方配置

### Requirement: 预测结果归一化为内部文本块
系统 SHALL 将 `@paddleocr/paddleocr-js` 的 `predict()` 输出归一化为现有图片解析链路可消费的内部文本块，确保文本内容与几何语义可继续映射到 `IntermediateDocument`。

#### Scenario: 单图预测结果映射为文本块
- **WHEN** `predict()` 返回当前图片的 OCR 结果，且结果包含 `items[].text` 与 `items[].poly`
- **THEN** 系统 MUST 基于每个文本项的多边形坐标生成可复用的文本块几何语义，并保留文本内容以供后续编码结果写入 `IntermediateDocument`

#### Scenario: 空白文本项不会进入文档
- **WHEN** `predict()` 返回的文本项为空字符串、仅包含空白字符或缺少有效坐标
- **THEN** 系统 MUST 忽略这些无效项，而不得向编码结果写入不可用的文本块

#### Scenario: 无识别结果仍视为合法空结果
- **WHEN** `predict()` 成功返回但当前图片没有任何有效文本项
- **THEN** 系统 MUST 将其视为合法空识别结果，以便上层继续生成可用的单页空文档，而不得将该情况视为运行时错误

### Requirement: 运行时失败与释放行为可恢复
系统 SHALL 在 OCR 实例创建失败、推理失败或显式释放后保持可恢复状态，避免缓存损坏导致后续图片解析持续失败。

#### Scenario: 创建或推理失败后清空损坏实例
- **WHEN** OCR 实例创建过程失败，或 `predict()` 执行期间抛出运行时异常
- **THEN** 系统 MUST 清空当前缓存的 OCR 实例，并向调用方抛出明确错误，使后续编码请求可以重新创建运行时

#### Scenario: 显式释放后可重新初始化
- **WHEN** 内部测试钩子或后续宿主释放入口显式触发 OCR 实例释放
- **THEN** 系统 MUST 调用底层 `dispose()` 释放资源，并保证下一次编码请求能够重新初始化新的 OCR 实例

### Requirement: 默认配置保持浏览器兼容集成
系统 SHALL 以当前项目可承载的最小浏览器配置集成 `@paddleocr/paddleocr-js`，并将第三方运行时资源路径与兼容参数限制在内部适配层中。

#### Scenario: 默认模式不依赖额外宿主隔离头
- **WHEN** 项目在现有 Demo 或常规浏览器宿主环境中执行图片 OCR
- **THEN** 系统 MUST 采用无需调用方额外配置 COOP、COEP 或高级并行能力的默认运行方式，以保证迁移后链路仍可直接使用

#### Scenario: 第三方资源配置不泄漏到文档层
- **WHEN** OCR 运行时需要解析模型、WASM 或其他静态资源路径
- **THEN** 系统 MUST 在内部适配层或 Demo 集成层处理这些配置，而不得将第三方资源路径或底层返回结构直接写入 `IntermediateDocument`
