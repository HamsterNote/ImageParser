## ADDED Requirements

### Requirement: 包标识固定为 ImageParser 包
系统 SHALL 将工作区声明为可独立消费和发布的 `@hamster-note/image-parser` 包，并在包元数据中使用与该标识一致的项目命名。

#### Scenario: 检查包名称与项目命名
- **WHEN** 消费者或发布流程读取包清单
- **THEN** `package.json` MUST 将包名声明为 `@hamster-note/image-parser`，并使用与 `ImageParser` 语义一致的描述性命名

### Requirement: 根入口导出与构建输出统一
系统 SHALL 通过单一根入口暴露公开 API，并将运行时与类型产物统一输出到 `dist/` 目录。

#### Scenario: 检查公开导出与构建产物约定
- **WHEN** 消费者根据包清单解析入口
- **THEN** 包元数据 MUST 指向 `src/index.ts` 对应生成的 `dist/index.*` 产物，并通过根级 `exports` 暴露统一入口

### Requirement: 发布内容限制为构建产物
系统 SHALL 将可发布内容限制为构建后的分发文件，避免把源码与无关工作区文件作为 npm 包内容公开。

#### Scenario: 检查发布文件范围
- **WHEN** 发布流程根据包配置收集文件
- **THEN** 包配置 MUST 将发布文件范围限制在 `dist/` 或等效构建产物目录内

### Requirement: 公开 API 预留图片解析扩展点
系统 SHALL 提供类型安全的图片解析公开入口骨架，以便后续能力可以在不破坏包标识和导出约定的前提下演进。

#### Scenario: 检查初始公开 API
- **WHEN** 开发者从包根入口导入图片解析能力
- **THEN** 系统 MUST 提供与图片解析语义一致的公开类或函数占位 API，并保持可被测试与构建验证的稳定签名
