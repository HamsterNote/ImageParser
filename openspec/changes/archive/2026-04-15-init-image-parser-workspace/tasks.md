## 1. 参考工程梳理

- [x] 1.1 对比 `../HtmlParser` 与当前工作区，列出需要复制的根目录配置、`src/`、`demo/` 与测试相关文件
- [x] 1.2 确认 `HtmlParser` 的公开入口和基础脚本约定，确定 `ImageParser` 初始占位 API 的最小命名方案

## 2. 工程骨架初始化

- [x] 2.1 复制并调整 `.gitignore`、`package.json`、`CHANGELOG.md`、TypeScript、Jest、Rolldown、ESLint 与 Prettier 配置
- [x] 2.2 创建 `src/`、`demo/` 及测试入口目录骨架，并移除或替换 HTML 专属命名和示例内容
- [x] 2.3 将包名、描述、入口、`exports`、`files` 与构建产物路径统一为 `@hamster-note/image-parser` 和 `dist/index.*`

## 3. 占位 API 与演示

- [x] 3.1 在 `src/index.ts` 暴露类型安全的图片解析占位类或函数，避免使用 `any` 并保持单一根入口
- [x] 3.2 为占位 API 提供可验证的受控行为，例如基础返回结构或明确的未实现错误
- [x] 3.3 更新 `demo/` 示例，使示例语义指向图片解析场景且不保留 HTML 专属标识

## 4. 测试与验证

- [x] 4.1 添加 Jest 测试覆盖根入口导出、占位 API 实例化或调用行为，以及类型友好的导入路径
- [x] 4.2 运行 `yarn test`，确认测试入口可执行并记录或修复与本变更相关的问题
- [x] 4.3 运行 `yarn build:all`，确认 Rolldown 与 DTS 输出到 `dist/` 的构建链路可用
- [x] 4.4 检查 `prepublishOnly` 依赖的发布前校验链路，确保初始化后的包具备可发布基础
