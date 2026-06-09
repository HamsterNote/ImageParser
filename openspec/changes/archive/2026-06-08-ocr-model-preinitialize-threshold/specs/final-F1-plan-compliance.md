# F1 Plan Compliance Audit — VERDICT REPORT

## VERDICT: APPROVE

## Per-Requirement Audit Table

### 11 Plan Constraints

| # | Constraint | Evidence (file:line) | Result |
|---|---|---|---|
| 1 | No auto-init at import/constructor — caller-triggered only | `src/index.ts:1664-1666` (`static initialize()` is exported method, not called at module scope); `src/index.ts:1634` (`class ImageParser` constructor is base class, no OCR init); OpenSpec spec.md:29-31 ("MUST NOT 在模块 import 阶段或类构造函数中自动触发") | **PASS** |
| 2 | `initialize()` returns `Promise<void>`, no options, no exposed OCR instance, reuses cache | `src/index.ts:1664-1666` (`static async initialize(): Promise<void> { await loadPaddleOcrRuntime() }` — no return value, no params, wraps existing cache); instance delegate at `:1668-1670` | **PASS** |
| 3 | `minScore` validates SYNC at top of `encode()` BEFORE any await/decode/create | `src/index.ts:1677` (`validateImageParserEncodeOptions(options)` — no `await`, pure sync call); `:1679` (`await toImageBlob(input)` — first async op AFTER validation); `:1681` OCR run after both | **PASS** |
| 4 | Boundary `minScore: 0` and `minScore: 1` are LEGAL | `src/index.ts:199-200` (`minScore < 0 \|\| minScore > 1` — only out-of-range throws; 0 and 1 pass); Test `:2312-2343` (`it.each` with boundary 0 and 1 passes) | **PASS** |
| 5 | Filtering at raw `OcrResultItem[]` boundary | `src/index.ts:1684-1693` (filter called on `ocrResult` — the raw `readonly OcrResultItem[]`); filter result passed to `normalizeOcrResult()` at `:1695` | **PASS** |
| 6 | Missing/NaN/non-finite score dropped ONLY when threshold set | `src/index.ts:1685-1693` (when `minScore !== undefined`, filter checks `typeof item.score === 'number' && Number.isFinite(item.score) && item.score >= minScore`); when no `minScore`, the `?:` uses `ocrResult` unfiltered; Tests `:2231-2285` (no options: all kept) and `:2138-2229` (with threshold: invalid score dropped) | **PASS** |
| 7 | `score` MUST NOT be added to `NormalizedOcrTextBlock`/`IntermediateText`/`IntermediateDocument` | `src/index.ts:64-71` (`NormalizedOcrTextBlock` — no `score` field); `:1306-1323` (`createOcrText()` — `new IntermediateText({...})` — no `score`); grep confirms `score` only appears at raw filter lines `:1689-1691` | **PASS** |
| 8 | Failed `initialize()` clears cache via `clearPaddleOcrInstance`; subsequent calls retry | `src/index.ts:427-430` (`.catch()` sets `paddleOcrInstancePromise = undefined` — cache cleared); `:406-434` (`loadPaddleOcrRuntime()` creates new promise on retry); Test `:2047-2064` (fail → retry → success) | **PASS** |
| 9 | Concurrent `Promise.all` dedupes via cached promise — ONE `PaddleOCR.create` call | `src/index.ts:407` (`if (!paddleOcrInstancePromise) { ... }` — assignment is synchronous on first call, subsequent calls see cached promise); Test `:2038-2045` (`Promise.all([initialize(), initialize()])` → `expect(mockCreate).toHaveBeenCalledTimes(1)`) | **PASS** |
| 10 | NO timing in `src/` — only in `demo/demo.js` | Grep for `performance.now`, `Date.now`, `console.time` in `src/` returns **zero matches**; `demo/demo.js:647-649` (`const startTime = performance.now(); ... const elapsed = ...`) — timing only in demo | **PASS** |
| 11 | Untouched: `openspec/specs/image-ocr-decode-overlay-preview/spec.md`, `demo/paddlejs-ocr-shim.js`, `package.json` | `git diff --stat HEAD -- openspec/specs/image-ocr-decode-overlay-preview/spec.md demo/paddlejs-ocr-shim.js package.json` **returns empty** | **PASS** |

### OpenSpec Delta Requirements (from `image-ocr-encode/spec.md`)

| Requirement | Evidence | Result |
|---|---|---|
| `ImageParser.initialize()` caller-triggered, `Promise<void>`, no OCR instance | `src/index.ts:1664-1666` | **PASS** |
| Instance `parser.initialize()` delegates to static | `src/index.ts:1668-1670` | **PASS** |
| import/constructor do NOT auto-init | See constraint #1 above | **PASS** |
| Concurrent `initialize()` dedupes | See constraint #9 above | **PASS** |
| `initialize()` and first `encode()` share cache | `src/index.ts:406-434` (same `loadPaddleOcrRuntime()`); Test `:2028-2036` (`initialize()` then `encode()` → `mockCreate` not called) | **PASS** |
| Failed `initialize()` clears cache, allows retry | See constraint #8 above | **PASS** |
| `encode(input, options?)` accepts `minScore` | `src/index.ts:1672-1699` (static), `:1701-1706` (instance) — `options?: ImageParserEncodeOptions` | **PASS** |
| No `options` → no filtering, backward compatible | `src/index.ts:1685-1693` (when `minScore === undefined`, `?:` returns `ocrResult` unfiltered); Test `:2346-2389` | **PASS** |
| `minScore` filter: `score >= minScore` retained | `src/index.ts:1689-1691`; Test `:2066-2136` | **PASS** |
| Missing/NaN/non-finite score dropped only when threshold set | See constraint #6 above | **PASS** |
| Boundary 0 and 1 pass validation | See constraint #4 above | **PASS** |
| Invalid `minScore` (<0, >1, NaN, Infinity, non-number) throws before OCR/decoder | `src/index.ts:189-206` (`validateImageParserEncodeOptions`); called at `:1677` before any `await`; Test `:2287-2310` (7 invalid values → throws, `mockCreate` NOT called) | **PASS** |
| Filtering at raw OCR boundary, NOT in `NormalizedOcrTextBlock` | See constraint #5 and #7 above | **PASS** |
| `score` NOT added to downstream types | See constraint #7 above | **PASS** |

### OpenSpec Delta Requirements (from `paddleocr-js-runtime-compatibility/spec.md`)

| Requirement | Evidence | Result |
|---|---|---|
| Explicit `initialize()` and first `encode()` share same cached OCR instance | `src/index.ts:406-434`; Test `:2028-2036` confirms | **PASS** |

### File Scope Audit

| File | Status |
|---|---|
| `src/index.ts` | ✅ Modified (intended) |
| `src/__tests__/imageParser.test.ts` | ✅ Modified (intended) |
| `demo/inspect.html` | ✅ Modified (intended) |
| `demo/demo.js` | ✅ Modified (intended, pre-existing 45a144e debug logging excluded) |
| `demo/paddlejs-ocr-shim.js` | ✅ UNCHANGED |
| `package.json` | ✅ UNCHANGED |
| `openspec/specs/image-ocr-decode-overlay-preview/spec.md` | ✅ UNCHANGED |
| `openspec/changes/add-ocr-initialize-min-score/` | ✅ Intended change artifact folder |

## Confidence Assessment

**Confidence: HIGH**

1. **All 11 plan constraints pass** with zero violations. Every "MUST" / "SHALL" / "MUST NOT" clause from the OpenSpec delta is accounted for.
2. **Evidence chain is complete**: Prior task evidence files (T1–T8) confirm builds pass, tests pass, guardrails clean, QA screenshots valid. All were inspected.
3. **Adversarial checks passed**: No timing in src/, no `score` leaked to output types, no extra options beyond `minScore`, untouched guard files confirmed zero-diff.
4. **Weak signal — potential nitpick**: Constraint #8 says "clears cache via `clearPaddleOcrInstance`" but failed `initialize()` actually sets `paddleOcrInstancePromise = undefined` inline (`src/index.ts:428`), not through the `clearPaddleOcrInstance()` function. This is semantically identical — the downstream OpenSpec spec only requires cache to be cleared (not via a specific named function). The test at `:2047-2064` confirms retry works. **Not a violation.**

## VERDICT: APPROVE
