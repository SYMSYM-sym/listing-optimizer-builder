"use client";

import type { Audit, AuditGapSeverity } from "@/lib/types";

const SEVERITY_STYLES: Record<AuditGapSeverity, string> = {
  P0: "bg-red-950/60 text-red-200 border-red-800/60",
  P1: "bg-amber-950/50 text-amber-200 border-amber-800/50",
  P2: "bg-zinc-800/80 text-zinc-300 border-zinc-700",
};

type AuditTabProps = {
  audit: Audit;
};

export function AuditTab({ audit }: AuditTabProps) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-sm font-medium text-zinc-200">Scorecard (current listing)</h3>
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-orange-300">{audit.scorecard.total}</span>
          <span className="text-zinc-500">/ {audit.scorecard.maxTotal}</span>
        </div>
        <div className="space-y-2">
          {audit.scorecard.criteria.map((criterion) => (
            <div
              key={criterion.id}
              className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-zinc-200">
                  {criterion.id} · {criterion.label}
                </span>
                <span className="text-zinc-400">
                  {criterion.score}/{criterion.maxScore}
                </span>
              </div>
              {criterion.notes && <p className="mt-1 text-xs text-zinc-500">{criterion.notes}</p>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-zinc-200">Gaps (current → proposed)</h3>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Field</th>
                <th className="px-3 py-2">Current</th>
                <th className="px-3 py-2">Proposed</th>
                <th className="px-3 py-2">Why</th>
                <th className="px-3 py-2">Severity</th>
              </tr>
            </thead>
            <tbody>
              {audit.gaps.map((gap) => (
                <tr key={`${gap.field}-${gap.severity}`} className="border-t border-zinc-800">
                  <td className="px-3 py-2 font-mono text-xs text-zinc-300">{gap.field}</td>
                  <td className="max-w-xs px-3 py-2 text-zinc-400">{gap.current}</td>
                  <td className="max-w-xs px-3 py-2 text-zinc-300">{gap.proposed}</td>
                  <td className="max-w-sm px-3 py-2 text-zinc-400">{gap.why}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[gap.severity]}`}
                    >
                      {gap.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-zinc-200">Gate result (proposed listing)</h3>
        {audit.gateResult.pass ? (
          <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-4 py-3 text-emerald-200">
            PASS — proposed listing cleared all compliance checks.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-3 text-red-200">
              FAIL — export final is blocked until these are resolved.
            </div>
            {audit.gateResult.failures.map((failure, index) => (
              <div
                key={`${failure.checkId}-${failure.field}-${index}`}
                className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm"
              >
                <p className="font-medium text-zinc-200">
                  {failure.checkId} · <span className="font-mono text-xs">{failure.field}</span>
                </p>
                <p className="mt-1 text-zinc-400">{failure.context}</p>
                <p className="mt-1 text-xs text-orange-300/90">Fix: {failure.fix}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
