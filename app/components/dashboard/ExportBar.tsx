"use client";

import { buildMarkdownExport } from "@/lib/export/markdown";
import type { Audit, OptimizedListing } from "@/lib/types";

type ExportBarProps = {
  optimized: OptimizedListing;
  audit: Audit;
};

export function ExportBar({ optimized, audit }: ExportBarProps) {
  const payload = { optimized, audit };

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  }

  function downloadMarkdown() {
    const markdown = buildMarkdownExport(optimized, audit);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `listing-${optimized.title.slice(0, 40).replace(/\s+/g, "-") || "export"}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Export</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyJson}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-500"
        >
          Copy all as JSON
        </button>
        <button
          type="button"
          onClick={downloadMarkdown}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-500"
        >
          Download Markdown
        </button>
        <button
          type="button"
          disabled={!audit.verified}
          title={
            audit.verified
              ? "Mark this run as verified for export"
              : "Blocked until the compliance gate passes"
          }
          className="rounded-lg border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 enabled:border-emerald-700 enabled:bg-emerald-950/50 enabled:text-emerald-200 enabled:hover:border-emerald-500"
        >
          Export final / mark verified
        </button>
      </div>
      {!audit.verified && (
        <p className="mt-3 text-xs text-amber-200/90">
          Export final is disabled because the gate did not pass ({audit.gateResult.failures.length}{" "}
          blocking {audit.gateResult.failures.length === 1 ? "failure" : "failures"}). Review the Audit
          tab for fixes.
        </p>
      )}
    </section>
  );
}
