## MODIFIED Requirements

### Requirement: 编码文档保留可回放原图
`ImageParser.encode()` SHALL 在生成单页 `IntermediateDocument` 时保存原始图片数据，并将 OCR 运行时归一化后的文本块坐标写入文档，使该文档在脱离 Demo 原始文件对象后仍可被 `ImageParser.decode()` 与 Demo 预览稳定回放。

#### Scenario: 编码结果包含原图 data URL
- **WHEN** 调用方使用图片输入执行 `ImageParser.encode()` 并取得返回的 `IntermediateDocument`
- **THEN** 第一页 MUST 包含可直接加载的原图 data URL，且页面宽高 MUST 与 OCR 识别使用的图片尺寸一致

#### Scenario: 解码不依赖上传文件对象
- **WHEN** 调用方仅持有 `ImageParser.encode()` 返回并序列化后的 `IntermediateDocument`
- **THEN** 系统 MUST 能从文档自身恢复图片来源以执行后续 `ImageParser.decode()`

#### Scenario: 编码结果保留可复用文本块坐标
- **WHEN** `ImageParser.encode()` 基于 `@paddleocr/paddleocr-js` 的预测结果生成中间文档
- **THEN** 文档中的文本块 MUST 保留供 `decode` 与 Demo 预览直接复用的页面坐标与尺寸，而不得要求下游重新读取第三方 OCR 原始多边形结果

## ADDED Requirements

### Requirement: 编码结果维持解码与预览语义稳定
系统 SHALL 在切换到 `@paddleocr/paddleocr-js` 后继续输出与现有 `decode`、Demo 覆盖层预览兼容的文档语义，确保运行时升级不会改变下游对图片页与文本块的消费方式。

#### Scenario: 迁移后解码继续使用文档文本块
- **WHEN** 调用方将迁移后 `ImageParser.encode()` 生成的 `IntermediateDocument` 传入 `ImageParser.decode()`
- **THEN** 系统 MUST 仅依赖文档内已保存的图片来源和文本块坐标完成标注绘制，而不得重新触发 OCR 推理或依赖新的第三方运行时输出结构

#### Scenario: Demo 预览继续复用文档坐标
- **WHEN** Demo 展示迁移后生成的 OCR 结果覆盖层预览
- **THEN** Demo MUST 使用 `IntermediateDocument` 中保存的文本块页面坐标绘制覆盖层，并保持与解码结果一致的标注语义
