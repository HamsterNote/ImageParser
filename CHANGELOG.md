# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [UnReleased]

### Added
- 新增基于 `@paddlejs-models/ocr` 的图片 OCR 编码能力，将识别文本映射为单页 `IntermediateDocument`
- 初始化 `@hamster-note/image-parser` 工程骨架，补齐 TypeScript、Jest、Rolldown、ESLint、Prettier、demo 与测试入口
- 新增类型安全的 `ImageParser` 占位 API、受控占位文档输出与基础示例页面

### Changed
- 更新 ImageParser demo 与测试，覆盖真实 OCR 输出、空识别结果、错误反馈和多输入载体一致性
