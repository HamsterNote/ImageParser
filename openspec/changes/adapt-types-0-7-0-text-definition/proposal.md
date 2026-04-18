## Why

当前项目依赖的 `@hamster-note/types` 仍停留在 `^0.5.1`，而目标升级版本 `0.7.0` 对 `Text` 类型定义进行了破坏性调整。若不明确约束 `ImageParser` 对新 `Text` 结构的适配要求，现有 OCR 编码、解码与序列化链路将无法稳定产出兼容的新中间文档。

## What Changes

- 将运行时依赖 `@hamster-note/types` 升级到 `0.7.0`，并同步调整与 `Text` 相关的构造、字段映射和类型引用。
- **BREAKING**：更新 `ImageParser.encode()` 产出的文本块语义，使其符合 `@hamster-note/types@0.7.0` 的 `Text` 定义，不再依赖旧版 `Text` 结构。
- 校正 `ImageParser.decode()`、画布渲染与文档序列化流程对 `Text` 字段的读取方式，确保旋转、方向、竖排与样式信息在新结构下仍可正确消费。
- 补充或调整互操作测试与文档兼容性验证，避免升级依赖后出现构建通过但文档读写失真的问题。

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `image-ocr-decode-overlay-preview`: 调整 OCR 中间文档中的文本块要求，明确 `ImageParser` 在升级到 `@hamster-note/types@0.7.0` 后，生成、读取与预览的 `Text` 数据必须兼容新版定义并保持可解码、可序列化、可预览。

## Impact

- 受影响代码：`package.json`、`yarn.lock`、`src/index.ts`、`src/__tests__/imageParser.test.ts`、`src/__tests__/dist-interop.test.ts`。
- 受影响依赖：`@hamster-note/types` 从 `0.5.x` 升级到 `0.7.0`，并要求调用链统一采用新版 `Text` 类型约束。
- 受影响系统：OCR 编码产物、解码渲染逻辑、`IntermediateDocument` 序列化/反序列化兼容性，以及对外类型互操作行为。
