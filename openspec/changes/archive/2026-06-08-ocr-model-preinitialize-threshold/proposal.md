# OCR Model Preinitialize and Score Threshold

## Why

用户要求优化 OCR 模型初始化性能，将初始化能力提前到 ImageParser 初始化阶段，并增加基于置信度的文本过滤功能。具体需求：

- 为了优化性能，把初始化 OCR 模型的能力提前到 ImageParser 初始化阶段
- Demo 增加"初始化模型"按钮，点击后初始化类/模型
- `encode` 增加参数，过滤相似度低于可选数值的文字，并在 Demo 上体现
- Demo 顺便显示处理时间，但处理时间只放 Demo，不进核心代码

## What Changes

- 暴露 `ImageParser.initialize()` 方法，允许调用方预初始化缓存的 PaddleOCR 运行时
- 为 `encode(input, { minScore })` 添加分数阈值过滤功能
- 更新 Demo UI：添加"初始化模型"按钮、阈值输入框和处理时间显示

## Capabilities

### Added Capabilities

- **OCR 模型预初始化**: `ImageParser.initialize()` 静态方法，返回 `Promise<void>`，复用现有 OCR 运行时缓存
- **分数阈值过滤**: `encode(input, { minScore })` 可选参数，仅保留 `score >= minScore` 的 OCR 结果
- **Demo 初始化控制**: 初始化模型按钮，支持幂等操作和状态显示
- **Demo 阈值输入**: 阈值输入框，支持 0-1 范围验证
- **Demo 处理时间**: 仅在 Demo 中显示 OCR 处理耗时

### Modified Capabilities

- **OCR 编码**: 更新 `ImageParser.encode()` 签名，支持可选的 `minScore` 参数
- **OCR 运行时兼容性**: 显式初始化与首次 encode 共享同一缓存实例

## Impact

- 核心 API 新增 `initialize()` 方法和 `minScore` 过滤选项
- 现有 `encode(input)` 调用保持向后兼容
- Demo UI 增强，提供更好的用户控制和反馈
- 不影响 `image-ocr-decode-overlay-preview` 规格
- 不引入核心代码中的计时功能