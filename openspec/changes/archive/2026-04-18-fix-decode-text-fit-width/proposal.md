## Why

当前 `ImageParser.decode()` 在将 OCR 文本渲染回图片时，文字绘制宽度与 `IntermediateText.width` 并不严格一致，导致部分文本无法正好撑满对应文本区域。需要补充明确的解码输出约束，确保回放图片时文字宽度与当前文本框宽度一致，从而提升预览结果与中间文档几何信息的一致性。

## What Changes

- 明确 `ImageParser.decode()` 在绘制 OCR 文本时，渲染后的文字宽度必须与当前 `IntermediateText.width` 对齐，而不是仅依赖默认字体测量结果。
- 补充解码阶段对文本宽度适配的行为要求，确保文字在对应文本区域内正好撑满宽度。
- 保持现有解码输入输出形式不变，仅收紧解码图片中文字回放的视觉一致性要求。

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `image-ocr-decode-overlay-preview`: 调整 `ImageParser.decode()` 的解码输出要求，新增文本回放宽度必须与中间文档当前文本宽度一致的行为约束。

## Impact

- 受影响代码主要位于 `src/index.ts` 中的解码绘制流程，包括 OCR 文本几何信息转换、Canvas 文本宽度计算与文字绘制逻辑。
- 受影响能力为 `openspec/specs/image-ocr-decode-overlay-preview/spec.md`，需要补充对应的 spec delta。
- 不涉及公开 API 变更，不新增外部依赖。
