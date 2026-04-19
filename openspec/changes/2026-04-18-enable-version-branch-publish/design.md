## Overview

本次变更沿用 `types` 与 `PdfParser` 已验证的发布模型，在 `ImageParser` 仓库内增加单一 GitHub Actions workflow，负责处理 `version/*` 分支触发的 npm 发布。

## Decisions

### 1. 采用单工作流承载 version 分支发布

发布逻辑集中在 `.github/workflows/publish.yml`：触发后完成依赖安装、版本存在性检查、构建与发布，避免引入额外脚本文件，便于后续与同类仓鼠笔记包保持一致。

### 2. 使用 `package.json` version 判断 dist-tag

工作流根据 `package.json` 当前版本号是否包含 `-dev` 或 `-beta` 决定发布到 `dev`、`beta` 或 `latest`，与现有参考仓库保持同一语义来源，避免把分支命名规则和 dist-tag 判定耦合在一起。

### 3. 显式声明公开 npm 发布配置

在 `package.json` 中补充 `publishConfig.access` 与 `publishConfig.registry`，让本地与 CI 的 `npm publish` 都具备稳定一致的默认目标，降低首次自动发布时因 registry 或访问级别缺省值不一致导致的失败风险。
