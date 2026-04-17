## 1. 依赖与运行时适配

- [x] 1.1 将 OCR 依赖从 `@paddlejs-models/ocr` 切换到固定版本的 `@paddleocr/paddleocr-js`，并更新锁文件与必要类型导入
- [x] 1.2 在 `src/index.ts` 内建立新的 OCR 适配边界，封装 `PaddleOCR.create()`、`predict()` 与 `dispose()` 生命周期
- [x] 1.3 实现懒加载单例缓存、失败复位与内部释放钩子，确保后续 `encode()` 可复用或重新初始化实例

## 2. 预测结果归一化

- [x] 2.1 将单图 `predict()` 输出中的 `items[].text`、`items[].poly` 归一化为现有内部文本块结构
- [x] 2.2 过滤空白文本、缺失坐标和非法多边形项，并将无有效文本结果视为合法空识别结果
- [x] 2.3 为实例创建失败与推理失败提供统一错误处理，保证损坏实例不会污染后续请求

## 3. 编码链路与浏览器集成

- [x] 3.1 接入新的 OCR 适配层到 `ImageParser.encode()`，保持 `IntermediateDocument` 的图片来源、页面尺寸与文本块契约不变
- [x] 3.2 更新浏览器侧打包配置与 Demo shim，使 `@paddleocr/paddleocr-js` 在默认主线程配置下可被正确加载
- [x] 3.3 验证 `ImageParser.decode()` 与 Demo 覆盖层继续仅依赖文档内图片数据和文本块坐标完成回放与预览

## 4. 测试与兼容回归

- [x] 4.1 将单元测试与 mock 切换到 `create()` / `predict()` / `dispose()` 生命周期，覆盖实例复用、显式释放与失败复位场景
- [x] 4.2 增加 `items[].poly` 归一化、空识别结果和无效文本项过滤的回归测试
- [x] 4.3 更新 dist 互操作与 Demo 相关验证，确保迁移后浏览器集成行为与现有链路兼容

## 5. 验证与变更记录

- [x] 5.1 运行相关测试与构建命令，确认迁移后的 OCR 编码、解码和打包流程通过验证
- [x] 5.2 更新 `CHANGELOG` 的 `[UnReleased]` 条目，记录 `@paddleocr/paddleocr-js` 迁移的兼容性变更
