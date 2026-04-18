## 1. 依赖与 OCR 边界

- [x] 1.1 在 `package.json` 中加入 `@paddlejs-models/ocr` 及其运行所需配套依赖，并更新锁文件
- [x] 1.2 为 `@paddlejs-models/ocr` 建立内部适配层类型，隔离第三方返回结构且不暴露到公共 API
- [x] 1.3 实现 OCR 模型延迟初始化逻辑，确保首次 `encode()` 前不会加载模型

## 2. 输入归一化与图片解码

- [x] 2.1 保留现有 `ParserInput` 支持范围，将 `Blob`、`ArrayBuffer`、`ArrayBufferView` 统一转换为可解码图片 `Blob`
- [x] 2.2 实现浏览器图片解码流程，提取原图宽高并产出可传给 OCR 的图像对象
- [x] 2.3 为图片解码失败、模型加载失败与 OCR 推理失败提供明确错误消息

## 3. 编码结果映射

- [x] 3.1 将 `ImageParser.inspect()` 更新为轻量 OCR 支持摘要，且不得触发 OCR 执行
- [x] 3.2 将 `ImageParser.encode()` 从占位文档替换为真实 OCR 编码流程
- [x] 3.3 将 OCR 文本块映射为单页 `IntermediateDocument`，页面尺寸继承原图尺寸
- [x] 3.4 为每个识别文本生成稳定 `IntermediateText`，包含内容、坐标、尺寸与基础排版回退字段
- [x] 3.5 在 OCR 成功但无文字时返回合法单页空文本文档，而不是抛出异常

## 4. 测试与示例

- [x] 4.1 Mock OCR 与图片解码边界，更新成功识别文本的 `encode()` 单元测试
- [x] 4.2 增加空识别结果、OCR 失败与图片解码失败的单元测试
- [x] 4.3 增加 `Blob`、`ArrayBuffer`、`ArrayBufferView` 输入载体一致性的单元测试
- [x] 4.4 更新 `demo/demo.js`，展示真实 OCR 输出、空结果与错误反馈

## 5. 验证

- [x] 5.1 运行测试套件，确认 OCR 编码行为与错误分支符合 spec
- [x] 5.2 运行构建命令，确认新增依赖与类型声明可正常打包
