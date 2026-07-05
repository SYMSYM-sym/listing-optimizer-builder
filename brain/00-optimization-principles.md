# Optimization Principles + AI-Discovery Notes

Core methodology for A9/A10 keyword ranking **and** AI-discovery retrieval (Rufus / "Alexa for Shopping" / COSMO entity retrieval). These are the reusable principles the engine optimizes toward and the audit scores against.

## Search-relevance / indexing
1. **Front-load the primary keyword** — category-defining term in the first ~75 chars of the title.
2. **One term, one place** — indexing counts a keyword once; don't waste space repeating a word already indexed (also enforced by the word-repetition rule).
3. **Backend = pure discovery reserve** — synonyms, misspellings, other-language variants that appear nowhere in visible copy.
4. **Fill every attribute field** — blank structured fields = lost filters + COSMO retrieval uncertainty.
5. **Map to the tightest valid browse node** — verify acceptance in Product Classifier.
6. **Cover the full query surface** — head terms, long-tail, use-case phrases, misspellings across title + highlights + bullets + backend, without duplication.

## AI-discovery / conversational retrieval (Rufus / Alexa / COSMO)
7. **Write for situations, not just keywords** — engines retrieve by buyer situation; lead content with the situation.
8. **One situational anchor per major use-case** — a distinct, quotable line per core scenario.
9. **Use comparative framing** — state what the product is for vs. alternatives and who it's best for; comparison is a major AI query class.
10. **Keep A+ modules as real text** — A9 ignores A+ text but AI/voice engines read it; comparison, "who it's for," FAQ must be extractable text, not baked into images.
11. **Mirror compliant buyer/review language** — align copy with real review phrasing so semantics reinforce each other.
12. **Seed accurate structured Q&A** — mirror the same facts in bullets and A+ FAQ so the AI cites consistent facts.

## Trust / conversion / durability
13. **Substantiated trust > forbidden social proof** — no star/review claims in copy; use documentable signals (longevity, units sold).
14. **Consistency is a ranking and trust asset** — every recurring fact must agree across all surfaces; conflicts trigger AI confusion and compliance risk.
15. **Time events 6–8 weeks ahead** — land listing/review changes early for reindex + AI-model incorporation (2–4 weeks steady-state).
16. **Worker ≠ checker** — whoever writes copy never approves it; an independent reviewer verifies against a rubric before any state advance.

## How AI engines retrieve & cite (detail)
- Retrieval is **situational**, not keyword-density-driven; the engine matches products to natural-language buyer situations, then cites the listing's own text, reviews, and Q&A.
- **A+ text is read** even though classic A9 ignores it — keep comparison / who-it's-for / FAQ as extractable text.
- **Comparison questions** are a major query class — give a compliant, quotable comparison line.
- **Reviews and Q&A feed the answer** — mirror exact compliant use-case phrasing; seed accurate Q&A.
- **Consistency drives citation confidence** — conflicts make the engine hedge or omit the product.
- **Reindex + model lag** — ~2–4 weeks steady-state, 6–8 weeks before a traffic event.

## Title precedence rule (resolves name-first vs keyword-first)
The **product name comes first**, always (gate check C8). The primary keyword is front-loaded *within the remainder* — i.e., immediately after the product name — not ahead of it. "Front-load the primary keyword" (principle 1) operates on the post-name span, never by displacing the leading product name.

## Title vs. Item Highlights division of labor (⏳ post-Jul 27 2026)
- **Title (≤75):** product name first + the single highest-value keyword cluster. Ruthlessly prioritized; overflow is relocated, not dropped.
- **Item Highlights (≤125, searchable):** absorbs secondary keywords, audience qualifiers ("for [audience]"), form/count/diet tags, and any term not in the title.
- **Net effect:** title = focused relevance + human clarity; Item Highlights = breadth + long-tail recovery. Together they cover the full query surface without duplicating each other.
