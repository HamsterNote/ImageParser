## ADDED Requirements

### Requirement: 公开 npm 发布配置显式声明
系统 SHALL 在包元数据中显式声明面向官方 npm registry 的公开发布配置，确保 `@hamster-note/image-parser` 可以被稳定地自动发布为公开包。

#### Scenario: 检查公开 registry 发布配置
- **WHEN** 发布流程读取 `package.json`
- **THEN** 包配置 MUST 将 `publishConfig.access` 声明为 `public`
- **AND** 包配置 MUST 将 `publishConfig.registry` 指向 `https://registry.npmjs.org/`

### Requirement: version 分支触发自动发布
系统 SHALL 提供由 GitHub Actions 驱动的 npm 发布工作流，使维护者可以通过推送 `version/*` 分支完成依赖安装、构建和版本发布。

#### Scenario: 推送 version 分支触发发布工作流
- **WHEN** 维护者推送匹配 `version/*` 的分支
- **THEN** 系统 MUST 触发仓库内的 npm 发布工作流
- **AND** 工作流 MUST 安装依赖并执行构建，再决定是否执行发布

#### Scenario: 已发布版本自动跳过
- **WHEN** npm registry 中已经存在当前 `package.json` 声明的版本号
- **THEN** 工作流 MUST 跳过 `npm publish` 步骤
- **AND** 工作流 MUST 避免因为重复发布导致失败

#### Scenario: 预发布版本映射 dist-tag
- **WHEN** `package.json` 的 `version` 包含 `-dev` 或 `-beta` 预发布后缀
- **THEN** 工作流 MUST 分别使用 `dev` 或 `beta` 作为 npm dist-tag 发布当前版本
- **AND** 当版本号不包含预发布后缀时，工作流 MUST 使用 `latest` 作为 dist-tag
