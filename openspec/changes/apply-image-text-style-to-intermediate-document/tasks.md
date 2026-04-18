## 1. OCR 归一化结构扩展

- [x] 1.1 扩展 `NormalizedOcrTextBlock` 及相关内部类型，为 `rotate`、`skew`、`italic`、`fontWeight` 提供明确字段
- [x] 1.2 调整 `normalizeOcrResult()` 的输出映射，确保文本内容、坐标与样式提示在同一内部块中统一收敛
- [x] 1.3 为点数不足、边长异常、空文本或非法多边形建立统一兜底分支，避免异常输入污染后续样式推断

## 2. 几何样式推断

- [x] 2.1 基于 `items[].poly` 实现文本块主方向角度计算，生成稳定的 `rotate` 值
- [x] 2.2 基于上下边平行度与左右边偏移实现 `skew` 推断，并对异常角度统一回退到默认值
- [x] 2.3 定义 `italic` 判定阈值与降级规则，使倾斜语义仅在可稳定区分时写入文档

## 3. 字重估算与文档写入

- [x] 3.1 增加基于局部图片裁剪与离屏 canvas 采样的轻量字重估算逻辑
- [x] 3.2 将字重估算结果收敛到有限档位，并在采样失败、低对比度或置信不足时回退到 `400`
- [x] 3.3 更新 `createOcrText()` 与 `ImageParser.encode()`，把样式字段稳定写入 `IntermediateText`，同时保持原图数据与对外接口不变

## 4. 解码与 Demo 复用验证

- [x] 4.1 校验 `ImageParser.decode()` 继续直接消费文档内的 `fontWeight`、`italic`、`rotate`、`skew`，并对缺失或异常样式值执行安全回退
- [x] 4.2 调整 Demo OCR 覆盖层与 Decode 预览链路，确保其复用同一份 `IntermediateDocument` 展示样式增强后的结果

## 5. 测试与回归验证

- [x] 5.1 更新 `src/__tests__/imageParser.test.ts` 的 mock 与断言，覆盖旋转文本、斜体文本、较粗字体及样式线索不足时的默认降级场景
- [x] 5.2 增加对文档序列化后仍可解码、Demo 预览继续复用文档坐标与样式字段的回归验证
- [x] 5.3 运行相关测试与构建检查，确认样式推断增强未破坏现有 OCR 编码、解码与 Demo 预览流程
