"use client";

import type { PipelineStep } from "@/app/components/dashboard/Dashboard";

export type StepStatus = "pending" | "active" | "completed" | "error";

const STEP_LABELS: Record<PipelineStep, string> = {
  ingest: "Ingestion",
  optimize: "Optimization",
  verify: "Verify gate",
  audit: "Audit",
};

const STATUS_STYLES: Record<StepStatus, string> = {
  pending: "border-zinc-800 bg-zinc-900/40 text-zinc-500",
  active: "border-orange-500/50 bg-orange-500/10 text-orange-200",
  completed: "border-emerald-700/50 bg-emerald-950/40 text-emerald-200",
  error: "border-red-800/60 bg-red-950/40 text-red-200",
};

type ProgressStepsProps = {
  statuses: Record<PipelineStep, StepStatus>;
  detail?: string;
  className?: string;
};

export function ProgressSteps({ statuses, detail, className = "" }: ProgressStepsProps) {
  const steps: PipelineStep[] = ["ingest", "optimize", "verify", "audit"];

  return (
    <section className={`rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 ${className}`}>
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">Run progress</h2>
      <ol className="grid gap-2 sm:grid-cols-4">
        {steps.map((step) => (
          <li
            key={step}
            className={`rounded-lg border px-3 py-2 text-sm ${STATUS_STYLES[statuses[step]]}`}
          >
            <span className="font-medium">{STEP_LABELS[step]}</span>
            <span className="mt-0.5 block text-xs capitalize opacity-80">{statuses[step]}</span>
          </li>
        ))}
      </ol>
      {detail && <p className="mt-3 text-xs text-zinc-500">{detail}</p>}
    </section>
  );
}
