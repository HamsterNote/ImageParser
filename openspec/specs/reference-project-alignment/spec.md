## Purpose

定义 `ImageParser` 工作区对齐参考工程的基线约束，确保初始化阶段以最小必要调整复用既有成熟工程模式。

## Requirements

### Requirement: 工程基线对齐参考项目
`ImageParser` 工作区 SHALL 以 `HtmlParser` 作为同类工程基线参考，并在目录组织、配置结构和常用脚本约定上保持一致。

#### Scenario: 对比参考工程结构
- **WHEN** 维护者将 `ImageParser` 与 `HtmlParser` 的工程骨架进行比对
- **THEN** `ImageParser` MUST 复用同类目录层级、关键配置文件类别与基础脚本组织方式

### Requirement: 场景差异仅做最小必要调整
系统 SHALL 仅针对图片解析语义做最小必要改名和内容替换，不得保留与 HTML 解析强绑定的名称、示例或行为描述。

#### Scenario: 检查领域语义替换
- **WHEN** 开发者检查源码骨架、示例内容或测试入口
- **THEN** 所有公开命名与示例语义 MUST 指向图片解析场景，且不得继续暴露 HTML 专属标识

### Requirement: 对齐现有工具链而不扩大范围
系统 SHALL 继承参考工程已验证的 TypeScript、Jest、Rolldown、ESLint 与 Prettier 基线，并避免在初始化阶段引入额外的架构重构或流程迁移。

#### Scenario: 校验工具链对齐策略
- **WHEN** 维护者审查初始化变更内容
- **THEN** 变更 MUST 以复用参考工程工具链为主，只允许执行包名、模块映射与场景文案相关的必要调整
