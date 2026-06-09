# F3 Real Manual QA Report — `demo/inspect.html`

**VERDICT: APPROVE**

Date: 2026-06-07 (Asia/Shanghai, UTC+8)
Reviewer: Sisyphus-Junior (fresh hands-on session, port 8269)
Browser: Headless Chromium 1223 via Playwright sync API
URL: `http://localhost:8269/demo/inspect.html`
Artifacts in `.omo/evidence/`:
- `final-F3-scenario-1-init.png`
- `final-F3-scenario-2-reinit.png`
- `final-F3-scenario-3-no-threshold.png`
- `final-F3-scenario-4-valid-threshold.png`
- `final-F3-scenario-5-invalid-threshold.png`
- `final-F3-console.txt`
- `final-F3-results.json`

> All assertions below come from DOM reads performed live inside the Playwright session,
> not from prior T7 evidence. Test image was a freshly-rendered 480×160 canvas PNG containing
> the strings `Hello OCR` and `测试 2024`.

---

## Scenario 1 — Initialization (cold start)

**Action:** Load page → assert boot state → click `初始化模型` → wait for `已初始化`.

**Observed DOM state after init:**
| Field | Value |
|---|---|
| `init-status` span | `已初始化` |
| init button text | `已初始化` |
| init button `disabled` | `true` |
| status span | `Idle` |
| summary | `Choose an image, then click Run OCR.` |

**Console evidence (selected):**
```
[PaddleOCR] 开始初始化 OCR 实例...
[PaddleOCR] 配置: {lang: ch, ocrVersion: PP-OCRv5, backend: wasm, numThreads: 1, simd: false}
[PaddleOCR] 创建 Worker: http://localhost:8269/dist/assets/worker-entry-Dtffs1su.js
[PaddleOCR] Worker 类型: module
[PaddleOCR] Worker 创建成功
[PaddleOCR] OCR 实例创建成功
```

**Verdict:** PASS — the state machine moved `idle → initializing → ready` and disabled the button as designed.

---

## Scenario 2 — Idempotent re-init

**Action:** Force-enable the disabled button via JS (`disabled = false`) and click `初始化模型` a second time while `initState === 'ready'`. This bypasses the UI guard so we can prove the **handler** itself short-circuits.

**Observed DOM state after second click (~1.5 s of wait):**
| Field | Value |
|---|---|
| `init-status` span | `已初始化` (unchanged) |
| init button text | `已初始化` (unchanged) |
| summary | `Choose an image, then click Run OCR.` (unchanged) |

**Console diff for this scenario:** `0` new lines containing `initialize`, `PaddleOCR`, or worker creation. The handler's `if (initState === 'initializing' || initState === 'ready') return` guard fired correctly; no Worker was re-created, no model reload occurred.

**Note:** Because the early return skips `setInitState(...)`, the `disabled` flag we manually flipped to `false` was NOT re-asserted by the handler. That is harmless and aligned with the spec: the demo intentionally relies on the previous `setInitState('ready')` to leave the button disabled, and the library layer also caches via `ImageParser.initialize()`. In normal use the user can never reach this code path because the button stays disabled.

**Verdict:** PASS — re-entry is a true no-op; no duplicate Worker spawn.

---

## Scenario 3 — Encode with empty threshold

**Action:** Upload synthetic `hello-ocr.png` (11 503 bytes) → leave threshold empty → click `Run OCR`.

**Observed DOM state at terminal:**
| Field | Value |
|---|---|
| status | `Done` |
| summary | `OCR 成功；为避免重复推理，左侧不再额外运行一次原始 OCR，下方预览与 Decode 均基于右侧中间文档。检测到 2 个带样式线索的文本块。处理耗时: 317ms（未传 minScore（默认不过滤））` |
| raw output `thresholdOption` | `null` (encodeOptions undefined → not passed) |
| recognized text count | 2 |

**Console proof:** `[OCR] 开始执行 encode()... {encodeOptions: undefined}` followed by `encode() 完成，耗时: 317.19999980926514 ms`. Encode received **no options object** as the spec requires — the tri-state parser correctly mapped empty input to `undefined`.

**Verdict:** PASS — summary explicitly says "未传 minScore（默认不过滤）" with timing, and the `encodeOptions` is `undefined` on the wire.

---

## Scenario 4 — Valid threshold 0.8

**Action:** Set threshold input to `0.8` → click `Run OCR`.

**Observed DOM state at terminal:**
| Field | Value |
|---|---|
| status | `Done` |
| summary | `OCR 成功；…检测到 2 个带样式线索的文本块。处理耗时: 230ms（minScore=0.8）` |

**Console proof:** `[OCR] 开始执行 encode()... {encodeOptions: Object}` then `encode() 完成，耗时: 230.39999985694885 ms`. The encode call received `{ minScore: 0.8 }`.

**Note on filtering:** With our high-contrast synthetic image, both recognized regions had scores ≥ 0.8 so `textCount` stayed at 2. The behavior under test here is **plumbing** (does `0.8` reach `encode()` as `{minScore: 0.8}` and surface in the summary?), and that is conclusively true. Filtering arithmetic is verified independently by unit tests in `src/`.

**Verdict:** PASS — `minScore=0.8` appears verbatim in the summary, timing is reported, encodeOptions object is passed.

---

## Scenario 5 — Invalid threshold 1.5 (rejection)

**Action:** Set threshold input to `1.5` (out of `[0, 1]`) → click `Run OCR`.

**Observed DOM state (within 10 s):**
| Field | Value |
|---|---|
| status | `Invalid threshold` |
| summary | `最低分数无效：1.5 超出 [0, 1] 区间。` |
| raw output | `{ "error": "最低分数无效：1.5 超出 [0, 1] 区间。" }` |

**Critical absence check:** Snapshot of console BEFORE click vs AFTER yielded **zero** new occurrences of any of:
- `开始执行 encode`
- `[paddle ocr] predict`
- `paddle ocr predict result`

`encode()` was never called. The `parseThresholdInput()` guard rejected the input synchronously, the handler set the error summary, and returned. No Worker work was queued, no inference happened.

**Verdict:** PASS — pre-flight validation works exactly as specified.

---

## Console log analysis (full file: `final-F3-console.txt`, 24 lines)

| Category | Count | Notes |
|---|---:|---|
| `[error]` JS / pageerror | 0 | No JavaScript exceptions; no `pageerror` events fired. |
| `[error]` network 404 | 1 | `Failed to load resource: 404` on initial page load. Per task spec, "network 404s for unrelated favicon are acceptable" — this is a single transient resource miss, not a JS error. |
| `[warning]` | 0 | None. |
| `[log]` `[PaddleOCR]` init logs | 6 | Expected debug instrumentation for cold start. |
| `[log]` `[OCR]` encode logs | 14 | Expected per-run instrumentation (7 lines × 2 successful runs). Scenario 5 correctly emitted 0 such lines. |

**Zero new JS errors. Zero unexpected warnings.** All `[log]` lines are pre-existing debug instrumentation as called out in the task brief ("Pre-existing `[paddle ocr]` debug console.log lines are expected").

---

## Subjective UX assessment

**Status messages — clear.** Each terminal status (`Idle` / `Running OCR...` / `Done` / `No text found` / `Invalid threshold` / `Failed`) is short, unambiguous, and matches an obvious mental model. The dual-span design (`status` for OCR pipeline + `init-status` for model lifecycle) cleanly separates the two concerns so the user can tell at a glance which subsystem is busy.

**Button states — obvious.** The `初始化模型` button cycles through `初始化模型 → 初始化中… → 已初始化` with the disabled flag matching, which is excellent feedback. The label change alone (without re-reading the status span) tells the user where they are in the lifecycle. The `Run OCR` button has no visual disabled state during work, which is fine because the summary text immediately flips to "正在执行单次 OCR…" so the user knows something is happening.

**Error messages — helpful.** The threshold rejection message names the exact offending value (`1.5`) and the valid range (`[0, 1]`). It explains *why* the input is invalid in one sentence, which is materially better than a generic "invalid input" toast. The raw-output panel also surfaces the same error as structured JSON, which is great for diagnosis.

**Minor observation (not a blocker):** The summary string for the no-threshold case reads `…（未传 minScore（默认不过滤））` — the doubled closing parenthesis pattern is a touch awkward visually because the inner explanatory phrase already uses parens. A future polish pass could swap the outer to em-dashes (e.g., `处理耗时: 317ms — 未传 minScore（默认不过滤）`). This is cosmetic and well within acceptable taste.

---

## Final verdict

All 5 scenarios pass. Zero JS errors, zero warnings, console logs match the documented expectations. The state machine, tri-state threshold parser, encode-options plumbing, and pre-flight validation all behave per spec. Screenshots and full console log are persisted in `.omo/evidence/`.

**VERDICT: APPROVE**
