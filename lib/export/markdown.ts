import type { Audit, OptimizedListing } from "@/lib/types";

export function buildMarkdownExport(
  optimized: OptimizedListing,
  audit: Audit,
): string {
  const lines: string[] = [
    "# Optimized Listing Export",
    "",
    `Verified: ${audit.verified ? "YES" : "NO"}`,
    `Gate: ${audit.gateResult.pass ? "PASS" : "FAIL"}`,
    "",
    "## Title",
    optimized.title,
    "",
    "## Title 75",
    optimized.title75,
    "",
    "## Item Highlights",
    optimized.itemHighlights,
    "",
    "## Bullets",
    ...optimized.bullets.map((bullet, index) => `${index + 1}. ${bullet}`),
    "",
    "## Description",
    optimized.description,
    "",
    "## Backend Search Terms",
    optimized.backendSearchTerms,
    "",
    "## Attributes",
    ...Object.entries(optimized.attributes).map(([key, value]) => `- **${key}**: ${value}`),
    "",
    "## Audit Scorecard",
    `Total: ${audit.scorecard.total}/${audit.scorecard.maxTotal}`,
    "",
    ...audit.scorecard.criteria.map(
      (criterion) =>
        `- **${criterion.id}** (${criterion.score}/${criterion.maxScore}): ${criterion.notes ?? criterion.label}`,
    ),
    "",
    "## Gaps",
    ...audit.gaps.map(
      (gap) =>
        `- **[${gap.severity}] ${gap.field}**: ${gap.current} → ${gap.proposed} — ${gap.why}`,
    ),
  ];

  if (!audit.gateResult.pass) {
    lines.push("", "## Gate Failures");
    for (const failure of audit.gateResult.failures) {
      lines.push(`- **${failure.checkId}** \`${failure.field}\`: ${failure.context} — ${failure.fix}`);
    }
  }

  return lines.join("\n");
}
