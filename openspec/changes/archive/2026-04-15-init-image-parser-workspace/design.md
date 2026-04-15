## Context

`ImageParser` 当前仅包含仓库最小骨架，还没有可开发、可测试、可构建、可发布的 TypeScript 包工程基础。该变更的目标是先建立 `@hamster-note/image-parser` 的工程基线，而不是实现具体图片解析算法。

参考工程 `../HtmlParser` 已具备同类 npm 包的基础约定，包括 ESM 包声明、`dist` 输出、Rolldown + DTS 构建、Jest + ts-jest 测试、TypeScript/ESLint/Prettier 配置、`src/` 与 `demo/` 目录。因此本设计以复制并重命名工程骨架为主，针对图片解析场景保留最小必要差异。

## Goals / Non-Goals

**Goals:**

- 建立与 `HtmlParser` 对齐的根目录配置、源码目录、演示目录、测试入口和发布入口。
- 将包标识、导出入口和构建输出统一到 `@hamster-note/image-parser`、`src/index.ts` 和 `dist/`。
- 保持 TypeScript ESM 包形态，确保本地 `yarn test`、`yarn build:all` 和 `prepublishOnly` 具备可执行基础。
- 为后续图片解析能力预留稳定扩展点，避免当前阶段引入复杂解析逻辑。

**Non-Goals:**

- 不实现 OCR、图像版面识别、EXIF 解析或图片到中间文档的完整转换算法。
- 不重构 `HtmlParser`、`DocumentParser` 或 `@hamster-note/types`。
- 不引入新的运行时解析依赖，除非基础工程必须依赖已有仓鼠笔记包。
- 不改变现有发布流程，仅补齐 `ImageParser` 自身参与发布所需文件。

## Decisions

### 1. 以 `HtmlParser` 作为工程基线模板

采用 `HtmlParser` 的目录与配置作为初始模板，并将命名、包标识和示例内容调整为 `ImageParser`。这样可以复用团队已有包工程约定，降低后续维护成本。

备选方案是从零设计新的包结构，但会增加配置差异和发布风险；另一个方案是抽象共享脚手架，但当前只有初始化诉求，抽象成本高于收益。

### 2. 保持单入口 ESM 包发布模型

`package.json` 使用 `type: "module"`、`main/module/types` 指向 `dist/index.*`，`exports["."]` 只暴露根入口，`files` 仅发布 `dist`。源码从 `src/index.ts` 汇总导出，构建产物由 Rolldown 输出到 `dist/`。

备选方案是暴露多个子路径入口，但当前没有稳定的内部模块边界，过早开放会提高兼容性负担。

### 3. 先提供类型安全的解析器占位 API

`src/` 应包含面向图片解析的最小公开类或函数骨架，并对齐仓鼠笔记解析器生态的输入/输出类型约定。实现可以先返回受控的基础结构或抛出明确的未实现错误，但公开 API 命名需要能支撑后续能力演进。

备选方案是只创建空 `index.ts`，但会让构建和测试缺少真实验证目标；直接实现完整图片解析则超出本次工程初始化范围。

### 4. 测试与演示只验证工程可用性

Jest 测试优先覆盖导出入口、基础实例化/调用行为和构建友好的类型路径；`demo/` 保留轻量浏览或脚本入口，用于后续手动验证图片解析效果。

备选方案是暂不创建测试和演示，但这会削弱“可开发、可构建、可测试”的工程基线目标。

### 5. 配置文件最小改名，避免无关优化

TypeScript、Jest、Rolldown、ESLint、Prettier、`.gitignore` 和 `CHANGELOG.md` 以参考工程为准，只做包名、模块映射和描述性内容调整。对参考工程中暂时存在的脚本占位（如 `lint`）保持兼容，不在本变更中引入额外规范迁移。

备选方案是趁初始化统一升级 lint/build/test 体系，但会扩大变更范围并引入与图片解析无关的风险。

## Risks / Trade-offs

- [Risk] 过度复制 `HtmlParser` 中与 HTML 场景强绑定的文件或示例 → 逐项重命名并移除 HTML 专属逻辑，只保留工程基线与图片解析占位。
- [Risk] 占位 API 与未来真实图片解析需求不一致 → 公开入口保持窄接口，避免提前承诺复杂模块边界。
- [Risk] Jest 对 ESM 依赖的映射在新包中遗漏 `@hamster-note/*` 路径 → 复用参考工程映射方式，并在测试阶段验证入口导入。
- [Risk] 新包依赖版本与仓鼠笔记其他包不一致 → 初始版本跟随参考工程已使用的依赖范围，仅替换包名。
- [Risk] 初始化范围扩张到算法实现 → tasks 阶段将工程初始化与后续图片解析能力拆开，当前只交付可运行骨架。

## Migration Plan

1. 从 `HtmlParser` 复制基础配置与目录骨架到 `ImageParser`。
2. 将包名、源码注释、demo/test 命名和导出符号替换为图片解析语义。
3. 补齐 `CHANGELOG.md` 的 `[UnReleased]` 初始化记录。
4. 运行测试与构建验证工程基线可用。
5. 若初始化失败，回滚新增骨架文件并保留 OpenSpec 文档继续修正。

## Open Questions

- 初始公开 API 名称是否使用 `ImageParser` 类，还是提供函数式 `encode/decode` 入口，需要在任务拆分前确认或采用与 `HtmlParser` 最接近的命名。
- 图片解析的最终输入类型是否只接受 `File/Blob/ArrayBuffer`，还是同时支持 URL 与 Buffer，可在后续能力变更中细化。
