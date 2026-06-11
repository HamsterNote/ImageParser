# 升级 @hamster-note/types 至 0.8.0 并适配最新 API

## TL;DR
> **Summary**: 将 `@hamster-note/image-parser` 的 `@hamster-note/types` 依赖从 `0.7.0` 升级到 `0.8.0`，并以最小改动接入 `IntermediatePage.getContent()` 与 `IntermediateImage` thumbnail API。
> **Deliverables**:
> - `package.json` 与 `yarn.lock` 仅升级 `@hamster-note/types` 到 `0.8.0`
> - `src/index.ts` 使用 0.8.0 的 content/thumbnail API，保留既有 OCR 编码与解码行为
> - `src/__tests__/imageParser.test.ts` 与 `src/__tests__/dist-interop.test.ts` 覆盖新版 API
> - `yarn test`、`yarn build:all`、`npm pack --dry-run` 通过
> **Effort**: Medium
> **Parallel**: YES - 3 waves
> **Critical Path**: Task 1 → Task 2/3 → Task 4 → Task 5

## Context

### Original Request
- 用户原始请求：“升级 `@hamster-note/types` 到 0.8.0 并接上最新的 API”。

### Interview Summary
- 范围选择：用户选择“最小适配（推荐）”。只升级 `@hamster-note/types` 到 `0.8.0`，只做必要 API 适配。
- 测试策略：用户选择“TDD（推荐）”。先更新/新增针对 0.8.0 API 的测试并观察失败，再改实现。
- 明确排除：不升级其他依赖；不修改 `@hamster-note/image-parser` 自身版本号；不做无关重构、UI 改动、文档扩展或发布准备。

### Metis Review (gaps addressed)
- 旧 thumbnail 形态：默认策略为“输出新版 `IntermediateImage`；解码端兼容旧字符串 thumbnail 作为防御性运行时兼容”。
- 旧 text API：默认策略为“主路径使用 `getContent()`；不继续调用 `getTexts()`；如测试需要旧数据兼容，只在测试中用 cast 构造边界输入”。
- `dist` 产物：默认策略为“不手写、不新增提交 `dist/` 或 `demo/vendor/`；仅通过 `yarn build:all` 验证”。
- API 假设：必须用安装后的真实 `@hamster-note/types@0.8.0` 声明、`yarn test` 与 `yarn build:all` 验证，不能凭记忆改类型。

## Work Objectives

### Core Objective
- 让 `@hamster-note/image-parser` 在依赖 `@hamster-note/types@0.8.0` 时类型检查、测试、构建与打包 dry-run 全部通过，并保持图片 OCR 编码/解码行为不回退。

### Deliverables
- `package.json`：`dependencies["@hamster-note/types"]` 从 `0.7.0` 改为精确 `0.8.0`。
- `yarn.lock`：锁定 `@hamster-note/types@0.8.0`，不得顺带升级其他包。
- `src/index.ts`：编码端创建 `IntermediateImage` thumbnail 与 `content`；解码端通过 `getContent()` 获取文本内容，通过 `IntermediateImage.src` 解析 MIME。
- `src/__tests__/imageParser.test.ts`：测试新版 content 与 thumbnail 对象 API，并覆盖无 thumbnail/旧字符串 thumbnail 防御路径。
- `src/__tests__/dist-interop.test.ts`：dist 互操作测试改为新版 `getContent()` 与 `IntermediateImage` 断言。

### Definition of Done (verifiable conditions with commands)
- `yarn test --runInBand src/__tests__/imageParser.test.ts` 退出码为 `0`。
- `yarn test --runInBand src/__tests__/dist-interop.test.ts` 退出码为 `0`；若测试按现有逻辑因缺少 `dist/index.js` 自动 skip，必须先运行 `yarn build:all` 后再次执行该命令并通过。
- `yarn test` 退出码为 `0`。
- `yarn build:all` 退出码为 `0`，且无 TypeScript/dts 错误。
- `npm pack --dry-run` 退出码为 `0`，输出文件清单仅包含包配置允许的发布内容，不能因为本次工作新增无关文件。
- `git diff -- package.json yarn.lock src/index.ts src/__tests__/imageParser.test.ts src/__tests__/dist-interop.test.ts` 只包含上述范围内改动。

### Must Have
- 使用真实安装的 `@hamster-note/types@0.8.0` 验证 API。
- `ImageParser.encode()` 返回的第一页必须可通过 `getContent()` 读取 OCR 文本内容。
- `ImageParser.encode()` 返回的第一页 `getThumbnail()` 必须返回带 `src` data URL 的 `IntermediateImage`。
- `ImageParser.decode()` 必须不再调用 `firstPage.getTexts()`。
- 解码端必须能处理无 thumbnail，并默认回退到 `image/png`。

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- 不修改 `package.json` 的 `version` 字段。
- 不升级 TypeScript、Jest、Rolldown、PaddleOCR、document-parser 或其他无关依赖。
- 不引入大型 adapter 层、全局重构、测试框架重写或新构建工具。
- 不手写 `dist/`、不新增提交 `demo/vendor/`；构建生成的未跟踪产物应在最终状态前清理。
- 不保留对 0.8.0 声明中不存在的 `IntermediatePage.getTexts()` 的生产代码调用。

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: TDD + Jest (`package.json:10`, `jest.config.cjs:1`).
- QA policy: Every task has agent-executed scenarios.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`.
- Validation order: targeted Jest → full Jest → build → pack dry-run → git diff scope check.

## Execution Strategy

### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

- Wave 1: Task 1 (dependency + TDD contract tests)
- Wave 2: Task 2 (encode API migration), Task 3 (decode API migration)
- Wave 3: Task 4 (dist interop tests), Task 5 (full validation and cleanup)

### Dependency Matrix (full, all tasks)
- Task 1 blocks Task 2, Task 3, Task 4, Task 5.
- Task 2 blocks Task 4 and Task 5.
- Task 3 blocks Task 4 and Task 5.
- Task 4 blocks Task 5.
- Task 5 blocks Final Verification Wave.

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 1 task → `unspecified-high`
- Wave 2 → 2 tasks → `unspecified-high`, `unspecified-high`
- Wave 3 → 2 tasks → `quick`, `unspecified-high`

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. 升级依赖并建立 0.8.0 TDD 合同

  **What to do**: Run `yarn add @hamster-note/types@0.8.0 --exact` so `package.json` and `yarn.lock` move only this dependency. Inspect installed declarations under `node_modules/@hamster-note/types/dist/HamsterDocument/` and update tests first: replace direct expectations of `getTexts()` as the primary API with `getContent()`, add assertions that encoded pages expose `content` text entries, and add assertions that `getThumbnail()` resolves to an object with `src` data URL. Run targeted tests before implementation changes and record the expected failing output as TDD evidence.
  **Must NOT do**: Do not edit `src/index.ts` in this task except if needed to keep imports compiling after test-only changes; do not upgrade any other dependency; do not change package version.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: dependency lockfile plus test contract changes require careful diff control.
  - Skills: `[]` - no specialized skill needed.
  - Omitted: `frontend-ui-ux` - no UI work.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2, 3, 4, 5 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `package.json:12` - dependency block currently contains `@hamster-note/types` `0.7.0`.
  - Pattern: `package.json:59` - Yarn 1.22.22 package manager; use Yarn lockfile workflow.
  - Test: `src/__tests__/imageParser.test.ts:1` - main Jest test file with PaddleOCR and DOM/canvas mocks.
  - Test: `src/__tests__/dist-interop.test.ts:153` - current dist interop test still calls `firstPage.getTexts()`.
  - Config: `jest.config.cjs:1` - ts-jest ESM setup and module mapper for `@hamster-note/types`.
  - API/Type: `node_modules/@hamster-note/types/dist/HamsterDocument/IntermediatePage.d.ts` after install - verify `getContent()` and `getThumbnail()` signatures from real package.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `node -p "require('./package.json').dependencies['@hamster-note/types']"` prints exactly `0.8.0`.
  - [ ] `yarn list --pattern @hamster-note/types` shows `@hamster-note/types@0.8.0`.
  - [ ] `git diff -- package.json yarn.lock` shows no dependency changes except `@hamster-note/types`.
  - [ ] Before implementation fixes, `yarn test --runInBand src/__tests__/imageParser.test.ts` exits non-zero for the newly added 0.8.0 API expectations or related type/runtime mismatch, and output is saved to `.sisyphus/evidence/task-1-tdd-failure.txt`.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Dependency is pinned to 0.8.0
    Tool: Bash
    Steps: Run `node -p "require('./package.json').dependencies['@hamster-note/types']"` and `yarn list --pattern @hamster-note/types`.
    Expected: First command prints `0.8.0`; second command lists exactly `@hamster-note/types@0.8.0` for this package.
    Evidence: .sisyphus/evidence/task-1-dependency.txt

  Scenario: TDD contract fails before implementation
    Tool: Bash
    Steps: Run `yarn test --runInBand src/__tests__/imageParser.test.ts` immediately after test updates and before adapting production code.
    Expected: Command exits non-zero because production code still assumes 0.7.0 `getTexts()`/string thumbnail behavior or lacks new `getContent()`/`IntermediateImage` expectations.
    Evidence: .sisyphus/evidence/task-1-tdd-failure.txt
  ```

  **Commit**: NO | Message: `chore(types): upgrade hamster-note types to 0.8.0` | Files: `package.json`, `yarn.lock`, `src/__tests__/imageParser.test.ts`, `src/__tests__/dist-interop.test.ts`

- [x] 2. 迁移 encode 输出到 content 与 IntermediateImage

  **What to do**: Update `src/index.ts` so `createOcrDocument` constructs a 0.8.0-compatible page. Keep OCR text creation via `IntermediateText`, create one `IntermediateImage` thumbnail from the generated data URL, pass `content` containing the OCR text entries, and preserve `texts` only if the installed 0.8.0 constructor/serializer supports it and tests require serialized `.texts` compatibility. The encoded page must expose OCR text through `getContent()` and thumbnail through `getThumbnail()` as an `IntermediateImage` whose `src` is the original data URL.
  **Must NOT do**: Do not change OCR normalization, polygon math, PaddleOCR loading, or public parser method signatures.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: needs precise TypeScript migration against external class constructors.
  - Skills: `[]` - no specialized skill needed.
  - Omitted: `ai-slop-remover` - not a cleanup-only task.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 5 | Blocked By: 1

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `src/index.ts:1273` - `createOcrText` already creates valid `IntermediateText` instances.
  - Pattern: `src/index.ts:1552` - `createOcrDocument` currently passes `texts` and string `thumbnail` to `IntermediatePage`.
  - API/Type: `node_modules/@hamster-note/types/dist/HamsterDocument/IntermediateImage.d.ts` after install - constructor fields are `id`, `src`, `polygon`, `opacity`, optional `clip`.
  - API/Type: `node_modules/@hamster-note/types/dist/HamsterDocument/IntermediatePage.d.ts` after install - constructor accepts `content`, `texts`, `thumbnail`, `getContentFn`, `getThumbnailFn`.
  - Test: `src/__tests__/imageParser.test.ts:53` - dynamic imports expose `ImageParser` and `IntermediateDocumentApi` for encoded document assertions.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `ImageParser.encode(Uint8Array.from([1,2,3,4]))` returns an `IntermediateDocument` whose first page `await getContent()` returns the OCR text entries.
  - [ ] First page `await getThumbnail()` returns an object with string `src` beginning with `data:image/` and not a bare string.
  - [ ] Existing polygon/content assertions for OCR text still pass.
  - [ ] `yarn test --runInBand src/__tests__/imageParser.test.ts` reaches the next failing area or exits `0` if Task 3 is already complete.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Encoded OCR text is available through getContent
    Tool: Bash
    Steps: Run `yarn test --runInBand src/__tests__/imageParser.test.ts -t "encode"` after adding/adjusting assertions for `getContent()`.
    Expected: Test proves first page content contains an `IntermediateText` with expected OCR text and polygon coordinates.
    Evidence: .sisyphus/evidence/task-2-encode-content.txt

  Scenario: Encoded thumbnail uses IntermediateImage
    Tool: Bash
    Steps: Run the targeted encode thumbnail test in `src/__tests__/imageParser.test.ts`.
    Expected: `typeof thumbnail` is `object`, `thumbnail.src` starts with `data:image/`, and no assertion expects `thumbnail.trim()` directly.
    Evidence: .sisyphus/evidence/task-2-thumbnail-object.txt
  ```

  **Commit**: NO | Message: `fix(encode): emit 0.8 content and thumbnail objects` | Files: `src/index.ts`, `src/__tests__/imageParser.test.ts`

- [x] 3. 迁移 decode 到 getContent 并兼容 thumbnail.src

  **What to do**: Replace production `firstPage.getTexts()` usage with a helper that calls `firstPage.getContent()`, filters content items to text-like entries acceptable by `drawDecodedPage`, and keeps rendering behavior unchanged. Update `getDecodeMimeType` to read `thumbnail.src` when thumbnail is an `IntermediateImage`, to defensively accept legacy string thumbnail values, and to return the existing default MIME behavior when thumbnail is missing, blank, or not a data URL.
  **Must NOT do**: Do not require callers to provide thumbnails; do not throw solely because thumbnail is missing or malformed; do not change canvas rendering math.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: runtime compatibility and type narrowing must be exact.
  - Skills: `[]` - no specialized skill needed.
  - Omitted: `frontend-ui-ux` - no browser UI automation is required.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 4, 5 | Blocked By: 1

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `src/index.ts:1310` - `getDecodeMimeType` currently assumes `page.getThumbnail()` resolves to string.
  - Pattern: `src/index.ts:1363` - rendering helpers consume standardized text fields.
  - Pattern: `src/index.ts:1641` - decode currently calls `firstPage.getTexts()` before drawing.
  - API/Type: `node_modules/@hamster-note/types/dist/HamsterDocument/IntermediatePage.d.ts` after install - `getContent()` replaces declared text loading path.
  - Test: `src/__tests__/imageParser.test.ts:61` - canvas mocks allow asserting successful decode paths and error paths.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -R "\.getTexts()" src/index.ts` returns no matches.
  - [ ] Decode test with 0.8.0 `IntermediateImage` thumbnail exports using MIME parsed from `thumbnail.src`.
  - [ ] Decode test with no thumbnail does not throw before canvas export and falls back to default MIME.
  - [ ] Decode test with legacy string thumbnail still parses MIME through the defensive helper.
  - [ ] `yarn test --runInBand src/__tests__/imageParser.test.ts` exits `0` after Task 2 and Task 3 are complete.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Decode renders content from getContent
    Tool: Bash
    Steps: Run `yarn test --runInBand src/__tests__/imageParser.test.ts -t "decode"` after migrating decode.
    Expected: Canvas text drawing receives text from page content, and no production call uses `getTexts()`.
    Evidence: .sisyphus/evidence/task-3-decode-content.txt

  Scenario: Decode handles missing or legacy thumbnail
    Tool: Bash
    Steps: Run targeted tests for no thumbnail and casted legacy string thumbnail inputs.
    Expected: Missing thumbnail falls back to default MIME without crashing; legacy string thumbnail still parses data URL MIME.
    Evidence: .sisyphus/evidence/task-3-thumbnail-edge-cases.txt
  ```

  **Commit**: NO | Message: `fix(decode): read content and thumbnail src` | Files: `src/index.ts`, `src/__tests__/imageParser.test.ts`

- [x] 4. 更新 dist 互操作测试到最新 API

  **What to do**: Update `src/__tests__/dist-interop.test.ts` so built package interop checks use 0.8.0 API: first test should call `getContent()` and expect empty content for empty OCR; second test should serialize the document and verify text content/polygon remains compatible, adding thumbnail object/source assertions if build output exposes them. Run `yarn build:all` before the dist interop test if `dist/index.js` is absent.
  **Must NOT do**: Do not make the dist interop suite pass by weakening it to only check import success; do not skip meaningful API assertions.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: localized test update once API migration is complete.
  - Skills: `[]` - no specialized skill needed.
  - Omitted: `dev-browser` - no real browser interaction.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 5 | Blocked By: 1, 2, 3

  **References** (executor has NO interview context - be exhaustive):
  - Test: `src/__tests__/dist-interop.test.ts:153` - current empty OCR test imports built `ImageParser` and external `IntermediateDocument`.
  - Test: `src/__tests__/dist-interop.test.ts:171` - current test calls removed/undeclared `firstPage.getTexts()`.
  - Test: `src/__tests__/dist-interop.test.ts:176` - serialization test checks `serialized.pages[0]?.texts[0]` polygon/content.
  - Config: `rolldown.config.ts:11` - build emits package entry from `./src/index.ts` and treats `@hamster-note/types` as external.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `yarn build:all` exits `0` before dist interop validation.
  - [ ] `yarn test --runInBand src/__tests__/dist-interop.test.ts` exits `0` after build.
  - [ ] Dist interop tests no longer call `getTexts()`.
  - [ ] Dist interop still verifies `document instanceof IntermediateDocument` and serialized text polygon/content.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Built encode output uses getContent
    Tool: Bash
    Steps: Run `yarn build:all` then `yarn test --runInBand src/__tests__/dist-interop.test.ts -t "encode 返回"`.
    Expected: Built `ImageParser.encode` returns `IntermediateDocument`; first page `getContent()` returns empty array for empty OCR.
    Evidence: .sisyphus/evidence/task-4-dist-content.txt

  Scenario: Built serialization preserves text fields
    Tool: Bash
    Steps: Run `yarn test --runInBand src/__tests__/dist-interop.test.ts -t "序列化"` after build.
    Expected: Serialized text polygon equals `[[10,20],[110,20],[110,44],[10,44]]` and content equals `Hello OCR`.
    Evidence: .sisyphus/evidence/task-4-dist-serialization.txt
  ```

  **Commit**: NO | Message: `test(dist): assert 0.8 content interop` | Files: `src/__tests__/dist-interop.test.ts`

- [x] 5. 执行完整验证并清理生成物

  **What to do**: Run full validation commands, capture outputs, and ensure final working tree contains only intended source/test/dependency files. If `yarn build:all` creates untracked `dist/` or `demo/vendor/`, remove those generated directories before final status unless they were already tracked before this work. Run diff checks to confirm no package version bump and no unrelated dependency churn.
  **Must NOT do**: Do not commit; do not auto-approve final verification; do not hide failing tests by changing assertions to weaker behavior.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: final verification and scope policing require careful command interpretation.
  - Skills: `[]` - no specialized skill needed.
  - Omitted: `git-master` - no commit requested.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Final Verification Wave | Blocked By: 1, 2, 3, 4

  **References** (executor has NO interview context - be exhaustive):
  - Script: `package.json:5` - available scripts are `build:all`, `lint`, `test`.
  - Config: `.github/workflows/ci-pr.yml` - CI expects install, lint, test, build, and pack dry-run.
  - Config: `package.json:52` - package publishes only `dist`, so pack dry-run validates generated publish contents.
  - Guardrail: `package.json:3` - package self-version must stay `0.2.0`.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `yarn lint` exits `0` and prints the existing no-lint behavior.
  - [ ] `yarn test` exits `0`.
  - [ ] `yarn build:all` exits `0`.
  - [ ] `npm pack --dry-run` exits `0`.
  - [ ] `node -p "require('./package.json').version"` prints exactly `0.2.0`.
  - [ ] `git diff --name-only` contains only `package.json`, `yarn.lock`, `src/index.ts`, `src/__tests__/imageParser.test.ts`, and `src/__tests__/dist-interop.test.ts` unless evidence files are intentionally kept under `.sisyphus/evidence/` by the workflow.

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Full CI-equivalent validation passes
    Tool: Bash
    Steps: Run `yarn lint`, `yarn test`, `yarn build:all`, and `npm pack --dry-run` in order.
    Expected: All commands exit `0`; no TypeScript, Jest, build, or pack dry-run errors remain.
    Evidence: .sisyphus/evidence/task-5-full-validation.txt

  Scenario: Scope guardrails remain intact
    Tool: Bash
    Steps: Run `node -p "require('./package.json').version"`, `git diff --name-only`, and `git diff -- package.json yarn.lock`.
    Expected: Version stays `0.2.0`; changed files are limited to intended scope; dependency diff only changes `@hamster-note/types` to `0.8.0`.
    Evidence: .sisyphus/evidence/task-5-scope-check.txt
  ```

  **Commit**: NO | Message: `chore(types): adapt image parser to types 0.8` | Files: `package.json`, `yarn.lock`, `src/index.ts`, `src/__tests__/imageParser.test.ts`, `src/__tests__/dist-interop.test.ts`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [x] F1. Plan Compliance Audit — oracle [APPROVE]
- [x] F2. Code Quality Review — unspecified-high [APPROVE]
- [x] F3. Real Manual QA — unspecified-high [APPROVE]
- [x] F4. Scope Fidelity Check — deep [APPROVE]

## Commit Strategy
- Do not commit automatically. User did not request commits.
- If user later requests a commit, use one atomic commit after final approval: `chore(types): adapt image parser to types 0.8`.
- Commit must include only `package.json`, `yarn.lock`, `src/index.ts`, `src/__tests__/imageParser.test.ts`, and `src/__tests__/dist-interop.test.ts` unless the executor documents a justified evidence-file policy.

## Success Criteria
- Dependency is exactly `@hamster-note/types@0.8.0`.
- Production code no longer calls `IntermediatePage.getTexts()`.
- Encoded documents expose OCR text through 0.8.0 `getContent()`.
- Encoded thumbnails are `IntermediateImage` objects with `src` data URLs.
- Decode supports new thumbnail objects, missing thumbnails, and defensive legacy string thumbnails.
- Tests, build, and pack dry-run all pass without unrelated source or dependency changes.
