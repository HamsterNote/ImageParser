## 1. 规格与变更记录

- [ ] 1.1 新增 OpenSpec change 目录 `openspec/changes/add-ocr-initialize-min-score/`，包含 `proposal.md`、`tasks.md` 与本次涉及的 capability delta spec 文件
- [ ] 1.2 在 `image-ocr-encode` 的 delta spec 中描述 `ImageParser.initialize()` 行为、`encode(input, options)` 的 `minScore` 过滤与验证规则，并保留 `encode(input)` 既有语义
- [ ] 1.3 在 `paddleocr-js-runtime-compatibility` 的 delta spec 中以 MODIFIED 形式给“浏览器端 OCR 运行时受控初始化”要求新增一条共享缓存场景

## 2. 测试与实现

- [ ] 2.1 在 `src/__tests__/imageParser.test.ts` 为 `initialize()` 缓存复用、并发去重、失败重试，以及 `minScore` 边界保留/丢弃、非法值 fail-fast 添加失败 TDD 用例
- [ ] 2.2 在 `src/index.ts` 实现静态/实例 `initialize()`、`encode(input, options)` 入参验证与 raw OCR 边界过滤，并确保未传 options 时行为不变

## 3. 验证

- [ ] 3.1 运行 `npx -y -p @fission-ai/openspec openspec validate add-ocr-initialize-min-score --strict`，确认退出码 0
- [ ] 3.2 确认 `openspec/specs/image-ocr-decode-overlay-preview/spec.md` 在本次变更中保持未修改状态
