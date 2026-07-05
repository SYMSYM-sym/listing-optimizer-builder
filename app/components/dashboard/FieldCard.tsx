"use client";

import { CopyButton } from "@/app/components/dashboard/CopyButton";

type CounterMode = "chars" | "bytes";

type FieldCardProps = {
  label: string;
  value: string;
  limit: number;
  mode?: CounterMode;
  measure?: number;
  gateFailed?: boolean;
  monospace?: boolean;
};

export function FieldCard({
  label,
  value,
  limit,
  mode = "chars",
  measure,
  gateFailed = false,
  monospace = false,
}: FieldCardProps) {
  const count = measure ?? value.length;
  const overLimit = count > limit;
  const counterClass = overLimit || gateFailed ? "text-red-400" : "text-emerald-400";

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">{label}</h3>
          <p className={`text-xs ${counterClass}`}>
            {count}/{limit} {mode === "bytes" ? "UTF-8 bytes" : "chars"}
            {gateFailed && " · gate failure"}
          </p>
        </div>
        <CopyButton value={value} />
      </div>
      <pre
        className={`whitespace-pre-wrap break-words text-sm text-zinc-300 ${
          monospace ? "font-mono text-xs" : ""
        }`}
      >
        {value || "—"}
      </pre>
    </div>
  );
}
