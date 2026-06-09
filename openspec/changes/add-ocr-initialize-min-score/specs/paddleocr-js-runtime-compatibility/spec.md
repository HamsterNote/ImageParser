## MODIFIED Requirements

### Requirement: 浏览器端 OCR 运行时受控初始化
系统 SHALL 在浏览器端通过 `@paddleocr/paddleocr-js` 的受控适配层完成 OCR 运行时创建，并在不改变 `ImageParser.encode()` 对外调用方式的前提下复用已创建实例。

#### Scenario: 首次编码创建并缓存 OCR 实例
- **WHEN** 调用方首次使用图片输入执行 `ImageParser.encode()`
- **THEN** 系统 MUST 在内部调用 `PaddleOCR.create()` 创建 OCR 实例，并在后续编码请求中复用该实例，而不得为每次识别重复初始化运行时

#### Scenario: 调用方无需感知第三方生命周期
- **WHEN** 调用方继续使用现有 `ImageParser.encode()` API 发起图片 OCR
- **THEN** 系统 MUST 在内部完成运行时加载、实例创建与后续复用，而不得要求调用方直接传入 `create`、`predict` 或 `dispose` 相关第三方配置

#### Scenario: 显式 initialize 与首次 encode 共享同一缓存实例
- **WHEN** 调用方先成功调用 `ImageParser.initialize()`，再首次调用 `ImageParser.encode()`
- **THEN** 系统 MUST 让 `initialize()` 与 `encode()` 共享同一份已缓存的 OCR 运行时实例，仅触发一次 `PaddleOCR.create()`，而不得在 `encode()` 阶段重新创建运行时
