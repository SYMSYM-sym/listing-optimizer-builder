"use client";

import { CopyButton } from "@/app/components/dashboard/CopyButton";
import type { OptimizedListing } from "@/lib/types";

type AplusTabProps = {
  optimized: OptimizedListing;
};

export function AplusTab({ optimized }: AplusTabProps) {
  const { aplusContent } = optimized;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-200">FDA disclaimer</h3>
          <CopyButton value={aplusContent.fdaDisclaimer} />
        </div>
        <p className="text-sm text-zinc-300">{aplusContent.fdaDisclaimer}</p>
      </section>

      {aplusContent.modules.map((module) => {
        const text = [module.headline, module.body, module.subcopy ?? ""].filter(Boolean).join("\n\n");
        return (
          <section key={module.id} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium text-zinc-200">{module.id}</h3>
                <p className="text-xs text-zinc-500">
                  {module.claimBearing ? "Claim-bearing" : "Informational"}
                </p>
              </div>
              <CopyButton value={text} label={`Copy ${module.id}`} />
            </div>
            <p className="text-sm font-medium text-orange-200/90">{module.headline}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{module.body}</p>
            {module.subcopy && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">{module.subcopy}</p>
            )}
          </section>
        );
      })}

      {aplusContent.comparison.rows.length > 0 && (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
          <h3 className="mb-3 text-sm font-medium text-zinc-200">Comparison</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="pb-2 pr-4">Label</th>
                  <th className="pb-2 pr-4">Ours</th>
                  <th className="pb-2">Typical</th>
                </tr>
              </thead>
              <tbody>
                {aplusContent.comparison.rows.map((row) => (
                  <tr key={row.label} className="border-t border-zinc-800 text-zinc-300">
                    <td className="py-2 pr-4 font-medium">{row.label}</td>
                    <td className="py-2 pr-4">{row.ours}</td>
                    <td className="py-2">{row.typical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {aplusContent.faq.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-200">A+ FAQ</h3>
          {aplusContent.faq.map((item, index) => (
            <article key={index} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
              <div className="mb-2 flex justify-end">
                <CopyButton value={`Q: ${item.q}\nA: ${item.a}`} />
              </div>
              <p className="text-sm font-medium text-zinc-200">Q: {item.q}</p>
              <p className="mt-2 text-sm text-zinc-300">A: {item.a}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
