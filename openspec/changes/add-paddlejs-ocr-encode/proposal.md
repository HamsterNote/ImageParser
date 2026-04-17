## Why

`ImageParser.encode()` 当前仅返回占位文档，无法把图片中的文字转成 Hamster Note 可消费的中间文档，导致图片导入链路仍不可用。当前需要基于 `@paddlejs-models/ocr` 落地首个真实的图片文字识别能力，让 ImageParser 从工程骨架进入可用状态。

## What Changes

- 引入 `@paddlejs-models/ocr` 作为运行时依赖，为图片文字识别提供基础能力。
- 将 `ImageParser.encode()` 从占位实现升级为真实 OCR 编码流程，把识别出的文本与基础版面信息映射为 `IntermediateDocument`。
- 为图片 OCR 编码补充输入约束、空结果处理与错误反馈要求，确保调用方能区分“无文字”与“识别失败”。
- 更新与 `encode` 相关的测试和示例，验证图片输入可产出可消费的中间文档。

## Capabilities

### New Capabilities
- `image-ocr-encode`: 定义 ImageParser 对图片输入执行 OCR、产出 `IntermediateDocument` 以及处理空识别结果/识别失败的行为要求。

### Modified Capabilities
- 无

## Impact

- 受影响代码：`src/index.ts`、`src/__tests__/imageParser.test.ts`、`demo/demo.js`
- 受影响依赖：`package.json` 新增 `@paddlejs-models/ocr` 及其配套依赖
- 受影响系统：ImageParser 的图片导入链路、浏览器端 OCR 运行环境、后续基于中间文档的消费流程
