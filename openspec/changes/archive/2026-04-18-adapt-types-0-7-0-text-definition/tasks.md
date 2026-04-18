## 1. 依赖升级与文本适配边界

- [x] 1.1 将 `package.json` 与 `yarn.lock` 中的 `@hamster-note/types` 升级到 `0.7.0`，确保源码、测试与打包产物围绕同一版 `Text` 定义运行
- [x] 1.2 梳理 `src/index.ts` 中所有 `Text` / `IntermediateText` 的写入点与读取点，新增统一的文本写入层与读取层 helper，收口字段差异

## 2. 编码链路迁移到新版文本定义

- [x] 2.1 调整 `createOcrText()` 与相关组装流程，将 `NormalizedOcrTextBlock` 显式映射为兼容 `@hamster-note/types@0.7.0` 的文本结构，并定义缺省值、降级与字段推导规则
- [x] 2.2 保持原图 data URL、页面尺寸、文本内容、几何、方向、旋转、竖排与样式语义在编码后的 `IntermediateDocument` 中稳定可回放，不再依赖 `0.5.x` 旧字段

## 3. 解码与预览消费新版文本语义

- [x] 3.1 调整 `drawDecodedPage()` 及相关辅助函数，只消费标准化读取结果，稳定处理文本内容、方向、竖排、旋转、斜切与目标宽度，并保留越界裁剪保护
- [x] 3.2 更新 Demo / 预览覆盖层对文本块的读取方式，使红框绘制继续直接复用文档中的页面坐标与尺寸，而不回退到旧字段推导

## 4. 回归验证与交付收口

- [x] 4.1 更新 `src/__tests__/imageParser.test.ts`，覆盖编码、序列化往返、解码与新版文本语义消费契约
- [x] 4.2 更新 `src/__tests__/dist-interop.test.ts` 与必要的依赖版本说明，验证源码入口与 dist 产物在 `0.7.0` 下保持一致互操作行为
- [x] 4.3 复核 `proposal.md`、`design.md`、`specs/image-ocr-decode-overlay-preview/spec.md` 与实现任务的一致性，确认该变更具备进入 `/opsx-apply` 的完整输入
