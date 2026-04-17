## Why

`ImageParser` 当前只支持把图片识别为 `IntermediateDocument`，但缺少把识别结果重新绘制回图片并输出可预览结果的能力，Demo 也无法直观看到 OCR 标注效果。这使得解码链路、结果校验与交互演示都不完整，需要补齐 decode 与标注预览能力。

## What Changes

- 实现 `ImageParser.decode()`，将 `IntermediateDocument` 绘制回原始图片并输出 `ArrayBuffer`，用于生成可预览的标注图像。
- 为 OCR 结果增加可视化要求，在 Demo 中展示上传图片，并用红色方框标注识别到的文字区域，且展示图片最大宽度限制为 `800px`。
- 在 Demo 中新增 `Decode` 按钮，将前面 OCR 处理后的结果传给 `decode()`，并把返回的 `ArrayBuffer` 转成图片显示在页面底部。
- 补充与 decode、标注预览及 Demo 交互相关的测试与示例要求，确保解码输出与可视化链路可验证。

## Capabilities

### New Capabilities
- `image-ocr-decode-overlay-preview`: 定义 ImageParser 将 OCR 中间文档绘制为带标注图片、输出可展示二进制结果，以及 Demo 展示原图标注与解码结果预览的行为要求。

### Modified Capabilities
- 无

## Impact

- 受影响代码：`src/index.ts`、`demo/demo.js`、`demo/inspect.html`、`src/__tests__/imageParser.test.ts`
- 受影响接口：`ImageParser.decode()` 的实现与 Demo 页面的交互展示流程
- 受影响系统：OCR 识别结果校验链路、浏览器端标注渲染流程、ImageParser Demo 演示体验
