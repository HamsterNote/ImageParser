## Purpose

定义 `ImageParser` 的 GitHub Actions 自动化约束，确保拉取请求校验、`version/*` 分支发布 npm 包以及默认分支向 `dev` 的同步流程具备稳定且可重复的行为。

## Requirements

### Requirement: 拉取请求必须经过基础质量校验
系统 SHALL 在指向 `main` 或 `dev` 的拉取请求上执行统一的持续集成检查，用于阻止未通过验证的改动进入主分支或开发分支。

#### Scenario: 对目标分支为 main 或 dev 的 PR 执行校验
- **WHEN** 仓库收到一个目标分支为 `main` 或 `dev` 的拉取请求事件
- **THEN** 工作流 MUST 安装依赖并依次执行 `yarn lint`、`yarn test`、`yarn build:all` 与 `npm pack --dry-run`

### Requirement: 推送 version 分支时自动发布 npm 包
系统 SHALL 在推送 `version/*` 分支时触发 npm 发布流程，并根据包版本自动决定发布使用的 dist-tag。

#### Scenario: 推送稳定版本分支
- **WHEN** 仓库收到对形如 `version/1.2.3` 的分支推送
- **THEN** 工作流 MUST 读取 `package.json` 中的包名与版本，若该版本尚未发布，则以 `latest` 标签发布到 npm

#### Scenario: 推送预发布版本分支
- **WHEN** 仓库收到对形如 `version/1.2.3-dev.1` 或 `version/1.2.3-beta.1` 的分支推送
- **THEN** 工作流 MUST 根据 `package.json` 的版本后缀分别选择 `dev` 或 `beta` 作为 npm dist-tag，并在发布后确保对应 dist-tag 指向当前版本

#### Scenario: 已发布版本不重复发布
- **WHEN** 发布工作流检测到 `package.json` 中的版本已存在于 npm registry
- **THEN** 工作流 MUST 跳过构建与发布步骤，避免因重复发布导致失败

### Requirement: 默认分支变更需要同步到 dev
系统 SHALL 在 `main` 或 `master` 发生推送或相关 PR 更新时，自动将默认分支的最新提交同步到 `dev` 分支。

#### Scenario: 默认分支有新提交时同步到 dev
- **WHEN** `main` 或 `master` 收到推送，或针对它们的拉取请求被创建、更新或重新打开
- **THEN** 工作流 MUST 获取远端最新分支状态，并将默认分支无冲突地合并到 `dev`；若 `dev` 不存在则基于默认分支创建后再同步
