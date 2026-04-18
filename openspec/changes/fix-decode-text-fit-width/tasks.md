## 1. 解码宽度适配基础能力

- [x] 1.1 在 `src/index.ts` 中新增文本自然宽度测量与安全横向缩放比计算 helper，统一处理空文本、零宽度与非法目标宽度的降级判断
- [x] 1.2 让宽度适配 helper 只产出文本本地 X 轴的适配结果，保持现有 `fontSize`、基线、高度、`rotate` 与 `skew` 语义不变

## 2. 解码绘制流程接入宽度对齐

- [x] 2.1 调整 `drawDecodedPage()` 的文本绘制顺序，在设置字体、方向与局部变换后先测量自然字宽，再按 `IntermediateText.width` 应用本地横向缩放
- [x] 2.2 保留现有标注框与导出流程，并在无法安全适配的场景回退到稳定绘制路径，确保 `ImageParser.decode()` 不引入新的异常

## 3. 回归测试补强

- [x] 3.1 在 `src/__tests__/imageParser.test.ts` 中补充文本回放宽度对齐与编辑后 `width` 立即生效的回归用例，锁定“目标宽度契约”
- [x] 3.2 为空文本、空白文本、测量宽度异常或非法目标宽度补充降级用例，验证 `decode()` 仍能稳定导出结果

## 4. 变更收口

- [x] 4.1 复核 `fix-decode-text-fit-width` 的 spec、design 与实现任务一致性，确认该变更已具备进入 `/opsx-apply` 的完整输入
