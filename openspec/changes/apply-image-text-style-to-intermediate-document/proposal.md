## Why

当前 `ImageParser.encode()` 只能把 OCR 文本内容与坐标写入 `IntermediateDocument`，会把文字的旋转角度、倾斜感和粗细信息丢失，导致后续消费链路无法更准确地复原图片中文字的视觉语义。现在需要把这些样式线索补进中间文档，为后续渲染、编辑和导出提供更完整的文本表达基础。

## What Changes

- 扩展图片 OCR 编码能力，在文本块写入 `IntermediateDocument` 时补充文字样式信息，而不再统一回退为默认的 `fontWeight`、`italic`、`rotate` 与 `skew`。
- 为图片文字样式识别补充行为约束，明确系统需要基于图片中的可观测线索推断文字旋转角度、倾斜特征和粗细等级，并在信息不足时采用可预期的降级结果。
- 调整图片 OCR 相关文档语义要求，确保 `decode` 与 Demo 预览链路继续消费同一份带样式信息的 `IntermediateDocument`，避免样式字段只在编码阶段存在而无法复用。
- 补充与样式映射相关的测试与示例，覆盖常见的旋转文本、斜体文本和较粗字体场景，验证中间文档输出稳定可诊断。

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `image-ocr-decode-overlay-preview`: 扩展图片 OCR 编码与预览要求，明确 `ImageParser.encode()` 产出的文本块除内容与坐标外，还需保留可用于还原文字视觉语义的样式字段，并保证这些字段可被后续 `decode` / Demo 预览链路复用。

## Impact

- 受影响代码：`src/index.ts`、`src/__tests__/imageParser.test.ts`、`demo/demo.js`
- 受影响数据结构：`IntermediateDocument` 中图片 OCR 生成的文本块字段映射
- 受影响系统：图片 OCR 编码链路、`decode` 预览链路、Demo OCR 覆盖层预览与相关测试样例
