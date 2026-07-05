# Acceptance Criteria — the finished app must hit ≥9.5/10

Score the built app against this rubric (weights sum to 100). Ship only at ≥95.

| # | Criterion | Weight | What "high" looks like |
|---|---|---|---|
| 1 | **Goal fidelity** | 20 | Paste an ASIN URL → get the full Output Contract (title/title75/highlights/5 bullets/description/backend/attributes/A+ content/image plan/Q&A) + an audit. End-to-end, no manual glue. |
| 2 | **Compliance rigor** | 18 | Verbatim FDA disclaimer; banned disease terms blocked on every surface; allergen enforced; gate blocks export of a failing listing. Deterministic, unit-tested. |
| 3 | **Verify-gate correctness** | 15 | Checks **C1–C12 + C15 + A1–A8** implemented as pure functions with pass/fail fixtures (C13/C14 are source-project-only — omitted, see `brain/04`); negation-guard + normalization work; `runGate` returns structured failures; an empty disease-noun pack fails closed. |
| 4 | **Field-limit accuracy** | 10 | Title ≤200/≤75; highlights ≤125; 5 bullets ≤255; description ≤2000; backend ≤249 **bytes** (UTF-8, not chars). Enforced in code. |
| 5 | **Ingestion robustness** | 10 | ASIN parsed from many URL shapes; provider adapter works; graceful paste-HTML fallback; sensible errors on block/timeout; cached. |
| 6 | **Optimization quality** | 12 | Generated copy front-loads keywords, one situational anchor per use-case, comparison + who-it's-for present, backend has no title repeats, facts consistent across surfaces. |
| 7 | **Category-agnostic core** | 8 | Engine + gate take a `KnowledgePack`; supplements is one pack; adding a category needs no engine/gate edits (demonstrate the seam). |
| 8 | **UX / export** | 5 | Dashboard with progress, result tabs, per-field copy buttons, audit diff view, JSON + Markdown export. |
| 9 | **Portability / decoupling** | 2 | Repo self-contained; no private data from the source project; `.env.example` + README complete; Vercel deploy works. |

## Golden-ASIN end-to-end test (must pass before ship)
Run against **recorded fixtures** (mocked LLM + mocked ingestion provider) so the test is deterministic and free — a live LLM run may legitimately end `verified:false` (repair cap reached), and that is correct behavior, not a test failure. The pass:true assertion below is on a **recorded compliant fixture**, never on a forced/edited gate.
1. Use a recorded snapshot for a **public supplement ASIN**.
2. Run it through the pipeline with the recorded compliant optimization fixture.
3. Assert: ingestion returns a populated `ListingSnapshot`; the engine returns a full `OptimizedListing` (incl. `facts` + `aplusContent`); **`runGate` returns `pass: true`** on the compliant fixture; the audit lists ≥3 concrete gaps with severities; every field respects its limit (assert the **byte** count for backend and **char** counts for title/title75/highlights/bullets/description); export produces valid JSON and Markdown.
4. Negative test: feed a deliberately non-compliant fixture (disease term + missing disclaimer + 6 bullets + over-byte backend + empty disease-noun pack) and assert the gate returns the exact expected failures (including the fail-closed `PACK` failure) and the UI blocks "verified/export-final."
5. Live smoke (manual, not CI): one real ASIN through the real provider + LLM completes end-to-end; a `verified:false` outcome is acceptable and must surface the blocking failures rather than be laundered.

## Build health
- `npm run build` completes with no type errors.
- `npm test` green (gate + ingestion unit tests).
- No API key in the client bundle (grep the build output).
