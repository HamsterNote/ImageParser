## Why

当前 `ImageParser` 工作区只有最小化仓库骨架，缺少可开发、可构建、可测试、可发布的工程基础设施，无法作为 `@hamster-note/image-parser` 包继续演进。现在需要以 `../HtmlParser` 为参考建立同类工程基线，快速对齐目录结构、配置文件和发布约定，为后续实现图片解析能力提供稳定起点。

## What Changes

- 初始化 `ImageParser` 工程工作区，使其具备与 `HtmlParser` 对齐的基础目录结构与工程配置。
- 建立 `@hamster-note/image-parser` 的包标识、构建产物约定和基础脚本，确保仓库可以作为独立 npm 包维护。
- 引入仓库级基础文件，例如 `.gitignore`、`CHANGELOG.md`、TypeScript/Jest/Rolldown/Prettier/ESLint 相关配置，并按 `ImageParser` 场景做必要命名调整。
- 对齐参考工程中的源码、演示、测试和发布入口所需骨架文件，为后续图片解析实现预留标准扩展点。

## Capabilities

### New Capabilities
- `workspace-bootstrap`: 定义 `ImageParser` 仓库必须具备的基础工程目录、配置文件和忽略规则，以支持日常开发、测试、构建与发布。
- `package-identity`: 定义包名、导出入口、构建输出和项目命名约定，确保仓库以 `@hamster-note/image-parser` 身份被消费和发布。
- `reference-project-alignment`: 定义工作区如何与 `HtmlParser` 的工程基线保持结构一致，同时允许针对图片解析场景做最小必要调整。

### Modified Capabilities

无。

## Impact

- 受影响代码与文件：仓库根目录基础文件、`package.json`、`.gitignore`、`CHANGELOG.md`、`tsconfig*.json`、`jest.config.cjs`、`rolldown.config.ts`、`eslint.config.js`、`prettier.config.cjs`、`src/`、`demo/`、`specs/`。
- 受影响系统：本地开发流程、测试流程、构建流程、npm 包发布流程。
- 依赖影响：需要继承或对齐参考工程的运行时依赖与开发依赖，并将包标识切换为 `@hamster-note/image-parser`。
