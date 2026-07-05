"use client";

import type { IngestProvider } from "@/lib/env";

type InputPanelProps = {
  url: string;
  provider: IngestProvider;
  pasteHtml: string;
  running: boolean;
  onUrlChange: (value: string) => void;
  onProviderChange: (value: IngestProvider) => void;
  onPasteHtmlChange: (value: string) => void;
  onSubmit: () => void;
};

const PROVIDERS: { id: IngestProvider; label: string }[] = [
  { id: "rainforest", label: "Rainforest" },
  { id: "firecrawl", label: "Firecrawl" },
  { id: "paste", label: "Paste HTML" },
];

export function InputPanel({
  url,
  provider,
  pasteHtml,
  running,
  onUrlChange,
  onProviderChange,
  onPasteHtmlChange,
  onSubmit,
}: InputPanelProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-xl shadow-black/20">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-300">Amazon URL or ASIN</span>
          <input
            type="text"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://www.amazon.com/dp/B0XXXXXXXXX"
            disabled={running}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-zinc-100 outline-none ring-orange-500/0 transition focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/30 disabled:opacity-60"
          />
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-300">Ingest provider</legend>
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                disabled={running}
                onClick={() => onProviderChange(entry.id)}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  provider === entry.id
                    ? "bg-orange-500 text-zinc-950"
                    : "border border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"
                } disabled:opacity-60`}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </fieldset>

        {provider === "paste" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-zinc-300">Pasted PDP HTML</span>
            <textarea
              value={pasteHtml}
              onChange={(event) => onPasteHtmlChange(event.target.value)}
              rows={6}
              disabled={running}
              placeholder="Paste the product detail page HTML here…"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 font-mono text-xs text-zinc-100 outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/30 disabled:opacity-60"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={running || !url.trim() || (provider === "paste" && !pasteHtml.trim())}
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? "Running…" : "Optimize"}
        </button>
      </form>
    </section>
  );
}
