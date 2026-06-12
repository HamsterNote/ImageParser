# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-05-02

### Added
- 新增基于 `@paddleocr/paddleocr-js` 的图片 OCR 编码能力，将识别文本映射为单页 `IntermediateDocument`
- 初始化 `@hamster-note/image-parser` 工程骨架，补齐 TypeScript、Jest、Rolldown、ESLint、Prettier、demo 与测试入口
- 新增类型安全的 `ImageParser` 占位 API、受控占位文档输出与基础示例页面
- 新增 GitHub Actions 自动化：PR 校验、`version/*` 分支 npm 发布、`main/master` 到 `dev` 的自动同步
- 新增推送 `version/*` 分支自动构建并发布 `@hamster-note/image-parser` 到 npm 的 GitHub Actions 工作流

### Changed
- 归档 `adapt-types-0-7-0-text-definition`、`add-paddlejs-ocr-encode`、`apply-image-text-style-to-intermediate-document`、`fix-decode-text-fit-width`、`fix-ocr-poly-geometry`、`replace-paddle-js-models-ocr-with-paddleocr-js` 变更目录，并将相关 capability 同步到主 `openspec/specs` 目录
- 更新 ImageParser demo 与测试，覆盖真实 OCR 输出、空识别结果、错误反馈和多输入载体一致性
- 将图片 OCR 运行时从 `@paddlejs-models/ocr` 迁移到 `@paddleocr/paddleocr-js`，改用 `PaddleOCR.create()` / `predict()` / `dispose()` 生命周期并保持 `IntermediateDocument`、`decode()` 与 Demo 预览兼容
- 补充 OpenSpec 发布自动化规范，约束 `ImageParser` 的 CI、npm 发布与分支同步行为
- 修复 demo 构建中 OpenCV shim 的本机绝对路径配置，避免 GitHub Actions 无法解析浏览器入口依赖
- 修复复杂文本 polygon 的点序归一化、baseline 定位和平均宽度回放，降低大角度、近竖排和梯形文本在 decode 阶段的几何偏差
- 调整四边形 polygon 起点归一化规则为按左上点稳定选序，并移除 baseline 原点的单小数舍入，修复 PR #4 在近竖排与裁剪文本场景下的 CI 测试失败
- 为 npm 公开发布补充 `publishConfig.access` 与 `publishConfig.registry`，对齐 version 分支自动发布链路

## [0.4.0] - 2026-06-11

### Added
- 新增 `minScore` 参数支持，允许在 OCR 编码时设置最小分数阈值，过滤低置信度识别结果
- 添加 `ImageParserEncodeOptions` 类型定义，支持可选的 `minScore` 配置
- 新增 `validateImageParserEncodeOptions` 函数，验证 `minScore` 参数有效性（0-1 之间的有限数字）
- 在 `encode` 方法中实现基于 `minScore` 的 OCR 结果过滤逻辑，在归一化之前完成过滤

### Changed
- 更新 `ImageParser.encode` 方法签名，支持可选的 `options` 参数
- 优化 OCR 结果处理流程，在原始结果上按 `minScore` 过滤后再进行归一化

## [0.3.0] - 2026-06-01

### Added
- 添加 OCR 调试日志和移动端调试工具，支持在移动端设备上诊断 OCR 识别问题
- 升级 `@hamster-note/types` 至 0.8.0，适配新型 `IntermediatePage.content` API

### Changed
- 简化 texts 数组复制写法，使用展开运算符替代手动逐项复制