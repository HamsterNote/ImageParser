## 1. 发布链路对齐

- [x] 1.1 为 `ImageParser` 新增推送 `version/*` 分支触发的 GitHub Actions 发布工作流
- [x] 1.2 在 `package.json` 中补充面向 npm 官方 registry 的公开发布配置

## 2. 规格与变更记录

- [x] 2.1 新增 OpenSpec proposal、design、tasks 与 `package-identity` spec delta，描述 version 分支发布要求
- [x] 2.2 更新 `CHANGELOG.md` 的 `[UnReleased]` 条目，记录发布自动化改动

## 3. 验证

- [x] 3.1 运行 JSON/YAML 语法校验与 `git diff --check`，确认新增工作流和 spec 文件格式正确
- [ ] 3.2 运行构建命令验证发布链路依赖；当前环境 Node `v14.19.3` 无法安装项目依赖，需在 Node 18.18+ / 20.9+ / 21.1+ 环境继续执行
