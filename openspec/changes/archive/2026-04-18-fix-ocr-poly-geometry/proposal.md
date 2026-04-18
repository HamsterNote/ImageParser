## Why

当前 OCR 结果中的 `poly` 字段是按顺时针排列的二维坐标点集，但现有解析逻辑没有按照该几何语义正确计算文字块的位置、宽度、高度与旋转角度，导致 `IntermediateDocument` 中的文本块尺寸不准，Demo 红框也无法稳定贴合真实文字区域。随着 `decode` 与覆盖层预览已成为核心校验链路，这个偏差会直接影响 OCR 结果可信度，因此需要尽快统一 `poly` 的解析与渲染规则。

## What Changes

- 修正 OCR `poly` 几何解析规则：明确以第 `0` 个点为左上角，按顺时针点序计算文字块位置、平均宽度、平均高度与文字旋转角度。
- 调整 `IntermediateDocument` 中 OCR 文本块的几何语义，确保编码结果使用同一套来源于 `poly` 的宽高与方向信息，而不是基于错误边长或轴对齐框近似。
- 优化 Demo 与 `decode` 预览中的红框绘制逻辑，使覆盖层与导出标注结果都遵循相同的旋转矩形语义，提升视觉校验准确性。
- 补充对应的规范与测试约束，确保后续 OCR 运行时或坐标适配调整不会再次破坏 `poly` 几何解析一致性。

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `image-ocr-decode-overlay-preview`: 调整图片 OCR 文本块几何解析与标注预览要求，明确 `poly` 点序、宽高计算、旋转角度推导，以及 Demo / `decode` 红框必须与该几何语义一致。

## Impact

- 受影响代码：`src/index.ts`、`demo/demo.js`、`demo/inspect.html`、`src/__tests__/imageParser.test.ts`
- 受影响接口：`ImageParser.encode()` 产出的 OCR 文本块几何字段、`ImageParser.decode()` 的标注绘制逻辑，以及 Demo 覆盖层预览行为
- 受影响系统：OCR 结果归一化流程、中间文档坐标语义、浏览器端旋转标注框渲染与结果校验体验
