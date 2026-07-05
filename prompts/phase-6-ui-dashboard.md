# PHASE 6 — UI dashboard

Build the operator-facing dashboard. Do only this phase.

## Build
1. **Input view:** URL field + "Optimize" button; optional "provider" toggle (Rainforest / Firecrawl / Paste). Paste mode reveals a textarea for PDP HTML.
2. **Run progress:** show ingestion → optimization → verify → audit as steps with live status.
3. **Results view — tabbed:**
   - **Listing** tab: each generated field (title, title75, itemHighlights, 5 bullets, description, backend, attributes) rendered with its **live char/byte counter vs the limit** and a **⧉ copy button** per field.
   - **A+ / Images / Q&A** tabs: the A+ content (module text + comparison + FAQ), slot plan, and Q&A pairs, each copyable.
   - **Audit** tab: the scorecard (per-principle), the `gaps[]` table (field · current → proposed · why · severity color-coded P0/P1/P2), and the **gate result** (green PASS or the blocking failures with their fixes).
4. **Export:** "Copy all as JSON" and "Download Markdown" — but **disable "Export final / mark verified" whenever `audit.verified` is false** (gate failing). Show why.
5. Match the clean dark dashboard style of a modern internal tool; per-field copy buttons use `navigator.clipboard`.

## Constraints
- The UI never re-computes limits itself in a way that could disagree with the gate — it reads the same limit constants from `knowledge/rules.json` and the gate's results.
- No API key or server secret reaches the client.

## Acceptance
- Full happy path works in the browser: paste URL → watch steps → see all tabs populated → copy fields → export.
- When the gate fails, the Audit tab shows the blocking failures and export-final is disabled.
- Char/byte counters match the gate's verdicts exactly.
