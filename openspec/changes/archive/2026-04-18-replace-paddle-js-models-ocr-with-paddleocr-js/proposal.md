## Why

当前项目的图片 OCR 运行时仍依赖 `@paddlejs-models/ocr`，而目标维护方向已经转向官方的 `@paddleocr/paddleocr-js`。继续绑定旧包会让依赖来源、运行时初始化方式与后续 OCR 能力升级脱节，因此需要明确迁移路径，并约束迁移后 `ImageParser` 的 OCR 输出兼容性。

## What Changes

- 将浏览器端 OCR 运行时依赖从 `@paddlejs-models/ocr` 切换为 `@paddleocr/paddleocr-js`，同步更新导入入口、打包配置与测试桩。
- 为新运行时补充适配要求，约束 `create` / `predict` / `dispose` 生命周期、识别结果归一化以及错误传播方式，避免第三方 API 直接泄漏到文档构建流程。
- 保持 `ImageParser.encode()`、`ImageParser.decode()` 与 Demo 预览链路对外可用，确保 OCR 结果仍能映射为当前 `IntermediateDocument` 与标注预览能力。
- 评估并记录新依赖链对浏览器运行环境、构建产物与测试隔离方式的影响，避免仅替换包名后留下运行时兼容问题。

## Capabilities

### New Capabilities
- `paddleocr-js-runtime-compatibility`: 定义 `ImageParser` 接入 `@paddleocr/paddleocr-js` 时的运行时初始化、推理结果归一化、资源释放与兼容性约束，确保新 OCR 引擎可稳定接入现有图片解析流程。

### Modified Capabilities
- `image-ocr-decode-overlay-preview`: 调整图片 OCR 编码能力要求，明确切换到 `@paddleocr/paddleocr-js` 后，编码结果仍需保持可回放原图、可复用文本块坐标以及可供 Demo / `decode` 预览的文档语义。

## Impact

- 受影响代码：`package.json`、`src/index.ts`、`src/paddlejs-ocr.d.ts`、`src/__tests__/imageParser.test.ts`、`src/__tests__/dist-interop.test.ts`、`demo/demo.js`、`demo/paddlejs-ocr-shim.js`、`rolldown.config.ts`
- 受影响依赖：主 OCR 运行时从 `@paddlejs-models/ocr` 迁移到 `@paddleocr/paddleocr-js`，并可能引入新的浏览器推理配套依赖链
- 受影响系统：浏览器端 OCR 初始化与推理流程、图片编码/解码链路、Demo 预览链路、单元测试 mock 与打包兼容性
