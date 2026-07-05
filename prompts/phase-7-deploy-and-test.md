# PHASE 7 — Deploy + acceptance test

Finalize, test end-to-end, and deploy. Do only this phase.

## Build
1. **Golden-ASIN E2E test** (`tests/e2e.golden.test.ts`) per `ACCEPTANCE-CRITERIA.md`:
   - Ingest a public supplement ASIN → populated snapshot.
   - Optimize → full `OptimizedListing`; assert every field respects its limit (assert the **byte** count for backend, char counts for title/highlights/bullets/description).
   - `runGate` → `pass:true`.
   - Audit → ≥3 gaps with severities.
   - Export → valid JSON + Markdown.
   - **Negative test:** the non-compliant fixture returns the exact expected gate failures and blocks export-final.
   (Mock the LLM + provider in CI with recorded fixtures so the test is deterministic and free.)
2. **README.md** for the app: what it does, setup (`.env` from `.env.example`), run, test, deploy, the ingestion ToS/legal note, and how to add a new category pack.
3. **Vercel config:** ensure server routes work as serverless functions; env vars documented; `npm run build` clean; no secret in the client bundle (add a CI grep check).
4. Deploy to Vercel; confirm a live run works.

## Acceptance (final — must hit ≥9.5 on `ACCEPTANCE-CRITERIA.md`)
- `npm run build` clean, `npm test` green (unit + golden E2E).
- Live Vercel URL runs a real ASIN end-to-end and blocks a failing one.
- README complete; `.env.example` accurate; no private/source-project data anywhere in the repo.
- Demonstrate the category seam: adding a stub `generic` or second pack requires **no** engine/gate edits.
