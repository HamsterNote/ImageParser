# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [UnReleased]

### Added
- 新增基于 `@paddleocr/paddleocr-js` 的图片 OCR 编码能力，将识别文本映射为单页 `IntermediateDocument`
- 初始化 `@hamster-note/image-parser` 工程骨架，补齐 TypeScript、Jest、Rolldown、ESLint、Prettier、demo 与测试入口
- 新增类型安全的 `ImageParser` 占位 API、受控占位文档输出与基础示例页面
- 新增 GitHub Actions 自动化：PR 校验、`version/*` 分支 npm 发布、`main/master` 到 `dev` 的自动同步

### Changed
- 归档 `adapt-types-0-7-0-text-definition`、`add-paddlejs-ocr-encode`、`apply-image-text-style-to-intermediate-document`、`fix-decode-text-fit-width`、`fix-ocr-poly-geometry`、`replace-paddle-js-models-ocr-with-paddleocr-js` 变更目录，并将相关 capability 同步到主 `openspec/specs` 目录
- 更新 ImageParser demo 与测试，覆盖真实 OCR 输出、空识别结果、错误反馈和多输入载体一致性
- 将图片 OCR 运行时从 `@paddlejs-models/ocr` 迁移到 `@paddleocr/paddleocr-js`，改用 `PaddleOCR.create()` / `predict()` / `dispose()` 生命周期并保持 `IntermediateDocument`、`decode()` 与 Demo 预览兼容
- 补充 OpenSpec 发布自动化规范，约束 `ImageParser` 的 CI、npm 发布与分支同步行为
- 修复 demo 构建中 OpenCV shim 的本机绝对路径配置，避免 GitHub Actions 无法解析浏览器入口依赖
