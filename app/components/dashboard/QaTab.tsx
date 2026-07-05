"use client";

import { CopyButton } from "@/app/components/dashboard/CopyButton";
import type { OptimizedListing } from "@/lib/types";

type QaTabProps = {
  optimized: OptimizedListing;
};

export function QaTab({ optimized }: QaTabProps) {
  return (
    <div className="space-y-4">
      {optimized.qa.map((item, index) => (
        <article key={index} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {item.claimBearing ? "Claim-bearing answer" : "Informational"}
            </p>
            <CopyButton value={`Q: ${item.question}\nA: ${item.answer}`} />
          </div>
          <p className="text-sm font-medium text-zinc-200">Q: {item.question}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">A: {item.answer}</p>
        </article>
      ))}
      {optimized.qa.length === 0 && <p className="text-sm text-zinc-500">No Q&A pairs generated.</p>}
    </div>
  );
}
