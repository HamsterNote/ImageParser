# 项目约定与注意事项

## API 变更 (0.7.0 → 0.8.0)

### IntermediatePage
- **移除**: `getTexts()` 方法
- **新增**: `getContent(): Promise<IntermediateContent[]>` 
- **变更**: `getThumbnail()` 返回 `Promise<IntermediateImage | undefined>`（不再是 string）
- **构造函数**: 接受 `content`, `texts`, `thumbnail`, `getThumbnailFn`, `getContentFn`
  - `thumbnail` 类型变为 `IntermediateImageSerialized`

### IntermediateImage (新增类)
- 字段: `id`, `src`, `polygon`, `opacity`, `clip?`
- `src` 是 data URL 字符串

### IntermediateContent
- `IntermediateContent = IntermediateText | IntermediateImage`

## 测试适配策略
- 测试中用 `getContent()` 替代 `getTexts()`
- 从 content 中过滤 text 类型: `content.filter(item => item instanceof IntermediateText)` 或检查 `item.content` 属性
- thumbnail 断言改为检查 `typeof thumbnail === 'object'` 和 `thumbnail.src.startsWith('data:image/')`
- 对于 mock/覆盖 getTexts 的测试，需要改为覆盖 getContent

## 生产代码适配策略 (Task 2/3)
- **encode (Task 2)**: 
  - `createOcrDocument` 需要创建 `IntermediateImage` 作为 thumbnail
  - 传递 `content` 给 `IntermediatePage` 构造函数
  - 保留 `texts` 以保持序列化兼容
- **decode (Task 3)**:
  - 用 `getContent()` 替代 `getTexts()`
  - 从 content 中过滤出 text 条目传给 `drawDecodedPage`
  - `getDecodeMimeType` 需要处理 `IntermediateImage` 对象、string、undefined 三种情况

## 注意事项
- 不要修改 package.json version (保持 0.2.0)
- 不要升级其他依赖
- dist/ 和 demo/vendor/ 是构建产物，不要手动修改
- 使用真实安装的 @hamster-note/types@0.8.0 验证

## Task 1 TDD 合同记录
- 2026-05-23: 测试侧统一用 `getContent()` 并通过 `content` 字段类型守卫过滤文本内容，覆盖旧 `getTexts()` mock 时直接改写 `firstPage.getContent`。
- 2026-05-23: `getThumbnail()` 断言应先检查对象存在和 `typeof thumbnail === 'object'`，再断言 `thumbnail.src` 的 data URL。
- 2026-05-23: 指定测试失败输出保存到 `.sisyphus/evidence/task-1-tdd-failure.txt`，当前失败来自 `src/index.ts` 仍按 0.7.0 使用 string thumbnail 和 `getTexts()`。

## Task 3 decode getContent 迁移 - 2026-05-23
- `ImageParser.decode` 已改用 `firstPage.getContent()`，通过 `item instanceof IntermediateText` 过滤文本后传入 `drawDecodedPage`，不再调用 `getTexts()`。
- `getDecodeMimeType` 兼容 `IntermediateImage.src`、遗留 string thumbnail、缺失 thumbnail；因 0.8.0 类型签名不含 string，legacy 分支需先把 `rawThumbnail` 赋给 `unknown` 再收窄。
- `yarn test --runInBand src/__tests__/imageParser.test.ts -t "decode"` 当前被 Task 2/encode 范围的 `IntermediateImage.polygon` 类型错误阻断：`src/index.ts:1573 topLeft` 不符合 0.8.0 tuple polygon；grep 验证 `.getTexts()` 无匹配，详见 `.sisyphus/evidence/task-3-decode-content.txt`。

## Task 2 Encode 迁移记录
- 2026-05-23: `createOcrDocument` 已迁移到 0.8.0：导入并创建 `IntermediateImage` 作为 thumbnail，`src` 保留原 data URL；`IntermediatePage` 同时传入 `content` 与 `texts`。
- 2026-05-23: 实际安装的 `IntermediateImagePolygon` 来自 `utils/polygon`，类型是四点 tuple `[[x,y], ...]`，不是命名点对象；thumbnail polygon 使用 `[topLeft, topRight, bottomRight, bottomLeft]` 顺序。
- 2026-05-23: encode 验证命令 `yarn test --runInBand src/__tests__/imageParser.test.ts -t "encode"` 通过，证据保存到 `.sisyphus/evidence/task-2-encode-content.txt`。

## Task 3 instanceof 修复 - 2026-05-23
- `ImageParser.decode` 的 content 过滤已从 `instanceof IntermediateText` 改为鸭子类型：存在 `content` 字段且 `typeof item.content === "string"`，以兼容反序列化后的普通对象。
- `src/index.ts` LSP error 诊断为 clean。
- `yarn test --runInBand src/__tests__/imageParser.test.ts` 结果保存到 `.sisyphus/evidence/task-3-fix-instanceof.txt`：31/32 通过，唯一失败为“文档序列化后仍可保留样式字段并继续解码”，失败点在调用 decode 前的 `serializedText?.fontWeight` 为 undefined，属于序列化样式字段保留问题，不是 decode filter 逻辑。

## Task 3 serializedText 类型收窄 - 2026-05-23
- `src/__tests__/imageParser.test.ts` 中序列化文本断言改为从 `serialized.pages[0]?.content` 里用 `find` + `IntermediateTextSerialized` 类型守卫查找文本项，避免 `IntermediateContentSerialized` union 直接访问文本样式字段的 TS 错误。
- 验证通过：`yarn test --runInBand src/__tests__/imageParser.test.ts` 32/32 passed，证据见 `.sisyphus/evidence/task-3-serialized-fix.txt`。

## Task 3 dist-interop serializedText 类型收窄 - 2026-05-23
- `src/__tests__/dist-interop.test.ts` 中 `serializedText` 改为从 `serialized.pages[0]?.content` 使用 `find` + `IntermediateTextSerialized` 类型守卫定位文本项，避免 `IntermediateContentSerialized` union 直接访问文本字段。
- 验证通过：`yarn test --runInBand src/__tests__/dist-interop.test.ts` exit code 0；当前因 dist entry 不存在/未构建而 test suite skipped，证据见 `.sisyphus/evidence/task-3-dist-interop-fix.txt`。
