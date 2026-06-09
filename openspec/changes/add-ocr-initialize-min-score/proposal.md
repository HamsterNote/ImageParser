## Why

当前 `ImageParser.encode()` 在第一次被调用时才会懒加载并缓存 PaddleOCR 运行时，调用方无法在合适时机（例如页面空闲期或用户点击“初始化模型”按钮时）提前完成 OCR 运行时加载，导致首次识别延迟集中暴露在用户操作路径上。

同时，OCR 推理结果中已经携带每个文本项的置信度分数（`OcrResultItem.score`），但当前编码链路无法让调用方按置信度阈值过滤低置信度文字，难以在面向终端用户的场景中屏蔽明显误识别。

为了优化首次识别延迟并提供可控的低置信度过滤能力，本变更在不破坏现有 `encode(input)` 行为的前提下，新增显式预初始化入口与编码阶段的最小置信度过滤选项。

## What Changes

- 为 `ImageParser` 新增由调用方显式触发的 `initialize()` 方法（静态与实例签名一致），返回 `Promise<void>`，内部仅复用现有 PaddleOCR 运行时单例缓存，不引入新缓存、不返回 OCR 实例、不接受额外配置。
- 为 `ImageParser.encode()` 新增可选第二参数 `options?: { minScore?: number }`，当传入合法 `minScore` 时，在 raw OCR 结果边界过滤 `score < minScore` 以及 `score` 缺失/`NaN`/非有限数字的文本项；`score >= minScore` 保留。
- 当 `minScore` 不是有限数字或不在 `[0, 1]` 区间时，`encode()` MUST 在任何 OCR 初始化与图片解码之前快速失败抛错。
- `initialize()` 失败后清空缓存，后续 `initialize()` 与 `encode()` 调用可重新尝试。
- 在 `paddleocr-js-runtime-compatibility` 既有“浏览器端 OCR 运行时受控初始化”要求下新增一条场景，明确显式 `initialize()` 与首次 `encode()` 共享同一个缓存的 OCR 实例。

## Capabilities

### Modified Capabilities
- `image-ocr-encode`：新增 `ImageParser.initialize()` 行为约束、`encode(input, options)` 的 `minScore` 过滤与验证约束，并保留 `encode(input)` 既有语义。
- `paddleocr-js-runtime-compatibility`：在受控初始化要求下新增一条共享缓存的场景，覆盖显式 `initialize()` 与首次 `encode()` 复用同一 OCR 实例的行为。

## Impact

- 受影响文件：`src/index.ts`、`src/__tests__/imageParser.test.ts`、`openspec/changes/add-ocr-initialize-min-score/`
- 受影响系统：`ImageParser` 公开 API 与 OCR 运行时缓存复用链路
- 依赖影响：无新增依赖；继续沿用 `@paddleocr/paddleocr-js` 已缓存的 `loadPaddleOcrRuntime()` 单例
- 兼容性：未传入 `options` 的现有调用方行为完全保持不变；新增方法仅扩展 API 表面
