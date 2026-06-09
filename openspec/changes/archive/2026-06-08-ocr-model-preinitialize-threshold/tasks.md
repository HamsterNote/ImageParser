# Tasks

## Plan: ocr-model-preinitialize-threshold

- [x] 1. Update OpenSpec delta for initialize and minScore
- [x] 2. Add failing TDD coverage for initialize and minScore
- [x] 3. Implement core ImageParser initialize and minScore filtering
- [x] 4. Update Demo with initialize button, threshold input, and processing time
- [x] 5. Review public types, build output compatibility, and package API surface
- [x] 6. Run full unit, lint, and build verification
- [x] 7. Perform Demo manual QA with existing local server flow
- [x] 8. Regression and scope-fidelity audit

## Final Verification Wave

- [~] F1. Plan Compliance Audit — oracle (BLOCKED: reviewer APPROVED, awaiting user okay per plan policy)
- [~] F2. Code Quality Review — unspecified-high (BLOCKED: reviewer APPROVED, awaiting user okay per plan policy)
- [~] F3. Real Manual QA — unspecified-high (+ webapp-testing for Demo) (BLOCKED: reviewer APPROVED, awaiting user okay per plan policy)
- [~] F4. Scope Fidelity Check — deep (BLOCKED: reviewer APPROVED, awaiting user okay per plan policy)

## 任务详情

### 1. Update OpenSpec delta for initialize and minScore

**目标**: 创建或更新相关的 OpenSpec 变更工件

**验收标准**:
- [ ] OpenSpec 工件存在或已根据存储库样式更新
- [ ] 规格说明 `ImageParser.initialize()` 是调用方触发的，返回 `Promise<void>`，并复用缓存的 OCR 运行时
- [ ] 规格说明 `encode(input)` 在省略选项时保持有效且不变
- [ ] 规格说明 `minScore` 范围为 `0..1`，无效值抛出错误，缺失/非有限项分数仅在设置 `minScore` 时丢弃，且 `score >= minScore` 被保留
- [ ] 规格排除核心库处理时间报告

**QA 场景**:
- 场景: Spec delta validates new API behavior
- 场景: Decode overlay spec untouched

### 2. Add failing TDD coverage for initialize and minScore

**目标**: 在 `src/__tests__/imageParser.test.ts` 中添加失败测试

**验收标准**:
- [ ] 新测试在实现之前因缺失/不正确的 `initialize()` 和 `minScore` 行为而失败
- [ ] 无效 `minScore` 测试断言在抛出错误之前没有发生 OCR 创建
- [ ] 并发初始化测试断言一次 `PaddleOCR.create` 调用
- [ ] 现有测试保持原样，未被削弱或跳过

**QA 场景**:
- 场景: TDD red state for new API
- 场景: Existing behavior not skipped

### 3. Implement core ImageParser initialize and minScore filtering

**目标**: 更新 `src/index.ts`

**验收标准**:
- [ ] `ImageParser.initialize()` 存在并返回 `Promise<void>`
- [ ] `new ImageParser().initialize()` 存在并委托给静态行为
- [ ] `initialize()` 和 `encode()` 共享相同的缓存 OCR 运行时
- [ ] 并发初始化调用通过现有缓存 promise 去重
- [ ] 失败的初始化清除缓存并允许重试
- [ ] `encode(input, { minScore })` 在文档创建前过滤原始 OCR 项
- [ ] 无效 `minScore` 在 OCR 创建/导入/预测之前失败
- [ ] `yarn test src/__tests__/imageParser.test.ts --runInBand` 通过

**QA 场景**:
- 场景: Unit tests pass after core implementation
- 场景: No timing or score leakage in core document model

### 4. Update Demo with initialize button, threshold input, and processing time

**目标**: 仅编辑 `demo/inspect.html` 和 `demo/demo.js`

**验收标准**:
- [ ] Demo 有可见的 `初始化模型` 按钮
- [ ] 按钮无需选择文件即可初始化 OCR/ImageParser 路径
- [ ] 重复点击按钮不会创建重复的 OCR 实例
- [ ] 阈值输入为空时不传递 `minScore` 选项
- [ ] 阈值输入数值传递 `{ minScore: value }` 到 `encode()`
- [ ] 无效阈值输入显示 Demo 错误且不调用 `encode()`
- [ ] OCR 运行后显示处理时间

**QA 场景**:
- 场景: Demo initialize button state path
- 场景: Demo threshold and timing path

### 5. Review public types, build output compatibility, and package API surface

**目标**: 验证 TypeScript 声明和构建输出将暴露新方法/选项

**验收标准**:
- [ ] TypeScript 构建识别静态和实例 `initialize()`
- [ ] TypeScript 构建识别静态和实例 `encode(input, options)`
- [ ] 现有无选项调用者保持类型有效
- [ ] 不发生包元数据/发布工作流更改

**QA 场景**:
- 场景: TypeScript build validates public API
- 场景: Dist interop stays compatible

### 6. Run full unit, lint, and build verification

**目标**: 执行现有存储库验证命令

**验收标准**:
- [ ] `yarn test` 退出 0
- [ ] `yarn build:all` 退出 0
- [ ] `yarn lint` 退出 0（如果脚本存在）
- [ ] 未引入新的跳过测试

**QA 场景**:
- 场景: Full Jest suite passes
- 场景: Build and lint pass

### 7. Perform Demo manual QA with existing local server flow

**目标**: 使用存储库的现有流程提供 Demo

**验收标准**:
- [ ] 在文件选择前点击 `初始化模型` 达到就绪状态或显示可重试失败
- [ ] 再次点击 `初始化模型` 是幂等的
- [ ] 空阈值的 OCR 运行仍然有效
- [ ] 阈值 `0.8` 的 OCR 运行传递 `{ minScore: 0.8 }` 并更新显示结果
- [ ] 无效阈值（如 `1.5`）阻止 OCR 并显示清晰的 Demo 错误
- [ ] OCR 运行后显示处理时间

**QA 场景**:
- 场景: Initialize before selecting image
- 场景: Invalid threshold blocks OCR

### 8. Regression and scope-fidelity audit

**目标**: 审查最终差异以确认范围纪律

**验收标准**:
- [ ] 最终差异不包含计划范围之外的更改
- [ ] `src/` 不包含处理时间代码
- [ ] `demo/paddlejs-ocr-shim.js` 无差异
- [ ] 无 `score`/`confidence` 字段添加到输出文档结构
- [ ] 未引入除 `minScore` 之外的新编码选项

**QA 场景**:
- 场景: Scope diff audit
- 场景: Guardrail text scan