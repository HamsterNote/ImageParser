# Design: OCR Model Preinitialize and Score Threshold

## Context

### 项目背景

- 用户要求优化 OCR 模型初始化性能，将初始化能力提前到 ImageParser 初始化阶段
- 需要增加基于置信度的文本过滤功能
- Demo 需要提供更好的用户控制和反馈

### 技术背景

- OpenSpec 变更文件夹布局遵循现有约定：`.openspec.yaml`、`proposal.md`、`tasks.md`、`specs/<capability-id>/spec.md`
- Delta spec 使用 `## ADDED Requirements` 和 `## MODIFIED Requirements` 格式
- 规格使用中文编写，关键要求使用英文大写关键词（SHALL、MUST、MUST NOT）
- 测试策略：TDD（测试驱动开发）

## Goals / Non-Goals

### Goals

- 暴露 `ImageParser.initialize()` 方法，允许调用方预初始化 OCR 运行时
- 为 `encode()` 添加 `minScore` 参数，支持基于置信度的文本过滤
- 更新 Demo UI，提供初始化控制、阈值输入和处理时间显示
- 保持现有 API 向后兼容
- 遵循 TDD 开发流程

### Non-Goals

- 不在核心代码中添加计时功能（`performance.now()`/`Date.now()`）
- 不修改 `demo/paddlejs-ocr-shim.js`
- 不修改 `openspec/specs/image-ocr-decode-overlay-preview/spec.md`
- 不引入浏览器 E2E 测试框架
- 不在模块导入时自动初始化 OCR
- 不在构造函数中触发 OCR 初始化
- 不添加新的 OCR 运行时缓存
- 不在输出文档结构中添加 `score` 字段

## Decisions

### 1. API 设计决策

**决策**: 使用静态方法 `ImageParser.initialize()` 和实例方法 `parser.initialize()`

**选择原因**:
- 保持静态/实例 API 一致性
- 允许调用方显式触发初始化
- 返回 `Promise<void>`，内部复用现有 `loadPaddleOcrRuntime()` 单例缓存

**备选方案**:
- 构造函数自动初始化：违反"不自动初始化"要求
- 模块导入时自动初始化：违反"不自动初始化"要求

**不采用原因**:
- 自动初始化会破坏现有懒加载语义
- 无法让调用方控制初始化时机

### 2. 过滤实现决策

**决策**: 在 `runOcr()` 返回后、`normalizeOcrResult()` 调用前进行过滤

**选择原因**:
- 最干净的边界：原始 OCR 项被过滤，然后标准化
- 不会将 `score` 字段泄漏到 `NormalizedOcrTextBlock`、`IntermediateText` 或 `IntermediateDocument`
- 过滤谓词：`typeof item.score === 'number' && Number.isFinite(item.score) && item.score >= minScore`

**备选方案**:
- 在 `normalizeOcrResult()` 内部过滤：需要修改标准化逻辑
- 在文档创建后过滤：需要修改文档结构

**不采用原因**:
- 会污染核心数据结构
- 增加不必要的复杂性

### 3. Demo 状态机设计

**决策**: 使用单一模块级变量 `initState` 管理初始化状态

**选择原因**:
- 状态转换清晰：`idle` → `initializing` → `ready` / `failed`
- 幂等性保证：`initializing` 或 `ready` 状态下重复点击直接返回
- 失败状态允许重试

**状态标签**:
- `initializing`: "初始化中…"
- `ready`: "已初始化"（按钮禁用）
- `failed`: "重试初始化"
- 默认: "未初始化"

### 4. 阈值解析策略

**决策**: 使用 `parseThresholdInput()` 函数解析阈值输入

**选择原因**:
- 返回三种状态：`{ value: undefined }`（空/空白）、`{ error: string }`（非有限/超范围）、`{ value: number }`（有效值）
- 在调用 `encode()` 前进行验证
- 空阈值时传递 `undefined` 选项对象，匹配无选项签名

**备选方案**:
- 直接解析数字：无法处理无效输入
- 使用正则表达式：过于复杂

**不采用原因**:
- 无法提供清晰的错误信息
- 无法区分空输入和无效输入

## Risks / Trade-offs

### 风险 1: 浏览器资源错误

**问题**: 浏览器控制台捕获到一个通用资源错误：`Failed to load resource: the server responded with a status of 404 (Not Found)`

**影响**: 不影响 OCR 初始化/运行场景，不阻塞 Demo 流程

**缓解措施**: 
- Playwright `requestfailed` 钩子未报告失败的应用请求
- 错误发生在 OCR 初始化之前
- 已在任务 7 的证据中记录

### 风险 2: 并发初始化处理

**问题**: 多个并发 `initialize()` 调用需要正确去重

**影响**: 如果处理不当，可能导致多个 OCR 实例创建

**缓解措施**:
- 使用现有的 `paddleOcrInstancePromise` 缓存单例
- `Promise.all([initialize(), initialize()])` 测试确保只创建一次
- 测试覆盖并发场景

### 风险 3: 边界情况处理

**问题**: `minScore` 验证需要处理多种边界情况

**影响**: 验证不当可能导致运行时错误或过滤不正确

**缓解措施**:
- 验证在 `encode()` 入口处进行，在任何异步 OCR 初始化之前
- 无效 `minScore`（小于 0、大于 1、`NaN`、非数字）必须抛出明确错误
- 缺失/无效项 `score`（`NaN`、非有限数字）仅在设置 `minScore` 时丢弃
- 测试覆盖所有边界情况

## Migration Plan

### 迁移步骤

1. **OpenSpec Delta 更新**（任务 1）
   - 创建或更新 OpenSpec 变更工件
   - 添加 `ImageParser.initialize()` 和 `minScore` 过滤的需求/场景
   - 限制规格更改范围

2. **TDD 测试覆盖**（任务 2）
   - 在 `src/__tests__/imageParser.test.ts` 中添加失败测试
   - 覆盖初始化、缓存复用、重试语义和 `minScore` 验证/过滤

3. **核心实现**（任务 3）
   - 更新 `src/index.ts`
   - 添加 `ImageParser.initialize()` 和 `minScore` 过滤
   - 保持向后兼容

4. **Demo 实现**（任务 4）
   - 更新 `demo/inspect.html` 和 `demo/demo.js`
   - 添加初始化按钮、阈值输入和处理时间显示

5. **公共类型审查**（任务 5）
   - 验证 TypeScript 声明和构建输出
   - 确保公共 API 无冲突

6. **完整验证**（任务 6）
   - 运行完整单元测试、lint 和构建验证
   - 捕获输出作为证据

7. **Demo 手动 QA**（任务 7）
   - 使用现有本地服务器流程验证 Demo
   - 捕获截图/日志作为证据

8. **回归和范围保真度审计**（任务 8）
   - 审查最终差异，确认仅计划内的文件更改
   - 确认无违规

### 回滚策略

如果出现问题，可以：
- 恢复 `src/index.ts` 到更改前状态
- 恢复 `demo/inspect.html` 和 `demo/demo.js`
- 删除 OpenSpec 变更文件夹
- 现有功能保持不变，因为所有更改都是向后兼容的