# Listing Optimizer — Builder Kit

This folder is a **self-contained build kit**. Copy it into a fresh workspace, open that workspace in Cursor, and paste the prompts in order. Cursor builds a working web app that takes an **Amazon listing URL** and returns an **optimized, compliance-verified set of listing inputs + a gap audit** — using the distilled methodology in `brain/`.

> This kit is generic. It contains **no** data from the project it was distilled from — only reusable rules, schemas, and engine logic. The app it builds works on any ASIN.

## What the app does
Input: an Amazon product URL (any ASIN).
Output: optimized `title` (legacy + 75-char), `itemHighlights`, 5 bullets, description, backend search terms, the full attribute set, A+ content (real module text + comparison + FAQ), an image/slot plan, and ~15 Q&A — every element run through a compliance/quality **verify gate** — plus an **audit** diffing the current listing against the proposed one.

Decisions locked for this build: **Next.js + Vercel** · ingestion via a **scraping/data API** (Rainforest or Firecrawl, with a paste-HTML fallback) · **supplements category first** (category-agnostic core) · output = **paste-ready inputs + audit**.

## How to use this kit
1. **Copy this whole folder** into a new, empty workspace/repo. (This original project is not involved afterward.)
2. Open the new workspace in **Cursor**.
3. Paste **`00-MASTER-BUILD-PROMPT.md`** into Cursor first. It orients the agent, points it at `brain/` and `ARCHITECTURE.md`, and sets the acceptance bar.
4. Then paste the phase prompts in `prompts/` **in numeric order** (`phase-0` → `phase-7`). Each is standalone, tells Cursor exactly what to build, and ends with an acceptance checklist to satisfy before moving on.
5. After phase-7, run the golden-ASIN acceptance test in `ACCEPTANCE-CRITERIA.md`.

## Folder map
- `00-MASTER-BUILD-PROMPT.md` — paste first; the orientation + rules prompt.
- `ARCHITECTURE.md` — stack, data flow, types, module layout, guardrails.
- `ACCEPTANCE-CRITERIA.md` — the ≥9.5 rubric the finished app must hit + the golden-ASIN test.
- `prompts/` — `phase-0`…`phase-7`, the ordered Cursor build prompts.
- `brain/` — the reusable knowledge base the app bakes in:
  - `00-optimization-principles.md` · `01-amazon-rules.md` · `02-compliance-framework.md` · `03-attribute-schema.md` · `04-verify-gate-spec.md` · `05-output-contract.md`

## Prerequisites the operator supplies (in the new workspace)
- An **Anthropic API key** (`ANTHROPIC_API_KEY`).
- A **Rainforest** or **Firecrawl** API key (or use the paste-HTML fallback with no key).
- Node 18+ and a Vercel account for deploy (optional for local dev).
