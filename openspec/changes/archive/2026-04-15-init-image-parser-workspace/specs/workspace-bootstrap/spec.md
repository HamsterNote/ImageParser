## ADDED Requirements

### Requirement: 工程基础文件齐备
`ImageParser` 工作区 SHALL 提供支持开发、测试、构建与发布所需的基础工程文件，包括根目录的忽略规则、变更记录、包清单以及 TypeScript、测试、构建、格式化与静态检查配置文件。

#### Scenario: 校验根目录工程文件
- **WHEN** 维护者检查 `ImageParser` 仓库根目录
- **THEN** 仓库中 MUST 存在满足工程基线的基础文件集合，例如 `package.json`、`.gitignore`、`CHANGELOG.md`、`tsconfig*.json`、`jest.config.cjs`、`rolldown.config.ts`、`eslint` 配置与 `prettier` 配置

### Requirement: 工作区目录骨架可扩展
`ImageParser` 工作区 SHALL 提供与包开发直接相关的标准目录骨架，以便源码、演示与测试能力可以在统一位置持续扩展。

#### Scenario: 校验标准目录骨架
- **WHEN** 开发者初始化或检视仓库目录结构
- **THEN** 仓库 MUST 至少包含 `src/` 与 `demo/` 等标准目录，并保留用于测试或规范扩展的明确入口

### Requirement: 基础脚本支持日常工作流
工作区 SHALL 在包脚本或等效入口中定义可执行的开发基础流程，使维护者能够运行测试、构建和发布前校验。

#### Scenario: 识别日常工程脚本
- **WHEN** 维护者查看包脚本配置
- **THEN** 系统 MUST 暴露与测试、构建或发布前校验相关的基础脚本入口，且这些入口命名与仓鼠笔记同类包约定保持一致
