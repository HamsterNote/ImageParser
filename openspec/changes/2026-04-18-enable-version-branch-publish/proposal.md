## Why

当前 `ImageParser` 虽然已经具备可构建、可测试的 npm 包基础，但仍缺少与 `types`、`PdfParser` 对齐的 GitHub Actions 发布入口，维护者无法通过推送 `version/*` 分支自动发布 `@hamster-note/image-parser`。同时，包元数据未显式声明公开发布配置，容易在首次自动发布时因访问级别或 registry 配置不明确而失败。

## What Changes

- 为 `ImageParser` 新增基于 GitHub Actions 的 npm 发布工作流，在推送 `version/*` 分支时自动安装依赖、构建项目并发布当前版本。
- 在 `package.json` 中补充 `publishConfig`，明确包以 `public` 访问级别发布到官方 npm registry。
- 通过 OpenSpec 扩充 `package-identity` capability，定义 version 分支发布与公开 registry 配置的约束。

## Capabilities

### Modified Capabilities
- `package-identity`: 增加公开 npm 发布配置与 version 分支自动发布要求，确保 `@hamster-note/image-parser` 的包身份与发布链路一致。

## Impact

- 受影响文件：`package.json`、`.github/workflows/publish.yml`、`CHANGELOG.md`、`openspec/changes/2026-04-18-enable-version-branch-publish/`
- 受影响系统：GitHub Actions 发布流程、npm 包公开发布配置
- 依赖影响：无新增运行时依赖，继续沿用现有 Yarn 安装与构建链路
