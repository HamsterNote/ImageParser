## 1. OCR 几何归一化重构

- [x] 1.1 在 `src/index.ts` 中拆分 OCR `poly` 处理流程，新增有序四边形校验与旋转矩形几何推导 helper，统一产出 `x`、`y`、`width`、`height`、`rotate`
- [x] 1.2 为 `poly` 点数不足、点位重复、边长过短或点序异常等场景补齐安全降级逻辑，确保可稳定回退到轴对齐包围盒几何

## 2. 编码与解码几何语义对齐

- [x] 2.1 调整 `normalizeOcrResult()` 与 `createOcrText()` 的组装流程，让中间文档的几何字段只来自新的旋转矩形结果，样式字段继续独立推断
- [x] 2.2 更新 `ImageParser.decode()` 的标注框绘制逻辑，确保红框直接复用文档中的 `x`、`y`、`width`、`height`、`rotate`，并处理越界绘制保护

## 3. Demo 预览一致性修复

- [x] 3.1 调整 `demo/demo.js` 的 OCR 覆盖层绘制逻辑，使预览红框与 `decode()` 共享同一套旋转矩形语义
- [x] 3.2 保留 `skew`、`italic` 等样式信息展示，但移除样式字段对红框几何的二次影响，确保预览只由文档几何字段决定

## 4. 回归验证与规范收口

- [x] 4.1 在 `src/__tests__/imageParser.test.ts` 中补充旋转框、轻微梯形与非法 `poly` 回退样例，锁定编码与解码的几何契约
- [x] 4.2 复核变更下的 spec / design 与实现任务一致性，确认 `fix-ocr-poly-geometry` 已具备进入 `/opsx-apply` 的完整输入
