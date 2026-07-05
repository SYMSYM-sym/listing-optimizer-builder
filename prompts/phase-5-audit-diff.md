# PHASE 5 — Audit + diff engine

Compare the current listing to the proposed one and score it. Do only this phase.

## Build
1. `lib/audit/scoreAgainstPrinciples.ts` — score the **current** `ListingSnapshot` against `knowledge/principles.json` (each principle → 0/partial/full + a one-line rationale), producing a `scorecard` (0–100 + per-principle breakdown).
2. `lib/audit/diff.ts` — field-by-field `gaps[]`: `{ field, current, proposed, why, severity: 'P0'|'P1'|'P2' }`. Severity from the rules: compliance/limit violations in the current listing = P0; missing high-value keyword coverage or empty ⭐ filter attributes = P1; polish = P2.
3. `lib/audit/buildAudit.ts` — assemble `Audit = { scorecard, gaps, gateResult, verified }`. Set **`verified = gateResult.pass`** — computed here in the audit module, which is separate from the generator, so worker≠checker holds structurally. There is no separate human-review flag in v1; do not gate `verified` on anything the app never sets.
4. Wire `app/api/optimize` to return `{ optimized, audit }` together.

## Acceptance
- For a real ASIN, the audit returns a scorecard, ≥3 concrete gaps with severities, and the gate result on the proposed listing.
- `verified === gateResult.pass`; it is false whenever the gate fails; export-final is blocked in that state (enforced in Phase 6 UI).
- The audit reasons about the **current vs proposed** delta, not just the proposed listing in isolation.
