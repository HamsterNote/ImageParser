## 1. 共享图片与绘制基础

- [x] 1.1 在 `src/index.ts` 提取基于 `IntermediateText` 的页面标注框读取与边界裁剪辅助函数
- [x] 1.2 在 `src/index.ts` 实现原图 data URL 生成、图片恢复与 MIME 回退辅助逻辑
- [x] 1.3 在 `src/index.ts` 实现 Canvas 原图绘制、红框覆盖和 Blob/`ArrayBuffer` 导出辅助逻辑

## 2. 编码与解码能力

- [x] 2.1 调整 `ImageParser.encode()`，在单页 `IntermediateDocument` 中写入可回放原图 `thumbnail` 并保持页面尺寸与 OCR 尺寸一致
- [x] 2.2 实现 `ImageParser.decode()`，从第一页 `thumbnail` 恢复原图并使用第一页文本块坐标绘制 OCR 红框后返回非空 `ArrayBuffer`
- [x] 2.3 为缺少页面图片来源、无法获取二维画布上下文和图片导出失败等场景补充明确错误处理

## 3. Demo 预览与交互

- [x] 3.1 更新 `demo/inspect.html` 与 `demo/demo.css`，新增原图 OCR 覆盖层预览区、`Decode` 按钮和解码结果展示区
- [x] 3.2 更新 `demo/demo.js`，基于最近一次 `IntermediateDocument` 渲染原图红框预览并限制预览最大宽度为 `800px`
- [x] 3.3 在 `demo/demo.js` 接入 `ImageParser.decode()` 调用，处理按钮可用状态、结果 URL 生命周期和错误反馈

## 4. 测试与验证

- [x] 4.1 扩展 `src/__tests__/imageParser.test.ts`，覆盖 encode 保存原图与 decode 成功导出标注图片的路径
- [x] 4.2 补充 decode 失败场景测试，覆盖缺少 `thumbnail`、画布上下文不可用、导出失败和异常坐标裁剪
- [x] 4.3 运行相关测试与构建，确认库与 Demo 改动满足新增规格
