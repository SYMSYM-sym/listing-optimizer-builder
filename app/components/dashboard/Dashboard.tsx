"use client";

import { useCallback, useState } from "react";
import type { IngestProvider } from "@/lib/env";
import type { Audit, OptimizedListing } from "@/lib/types";
import { InputPanel } from "@/app/components/dashboard/InputPanel";
import { ProgressSteps, type StepStatus } from "@/app/components/dashboard/ProgressSteps";
import { ResultsView } from "@/app/components/dashboard/ResultsView";

export type PipelineStep = "ingest" | "optimize" | "verify" | "audit";

type OptimizeProgressEvent = {
  step: string;
  status: "started" | "completed" | "error";
  message?: string;
};

const PIPELINE: PipelineStep[] = ["ingest", "optimize", "verify", "audit"];

function initialStatuses(): Record<PipelineStep, StepStatus> {
  return {
    ingest: "pending",
    optimize: "pending",
    verify: "pending",
    audit: "pending",
  };
}

export function Dashboard() {
  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState<IngestProvider>("rainforest");
  const [pasteHtml, setPasteHtml] = useState("");
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState(initialStatuses());
  const [optimizeDetail, setOptimizeDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [optimized, setOptimized] = useState<OptimizedListing | null>(null);
  const [audit, setAudit] = useState<Audit | null>(null);

  const setStep = useCallback((step: PipelineStep, status: StepStatus) => {
    setStatuses((current) => ({ ...current, [step]: status }));
  }, []);

  const runPipeline = useCallback(async () => {
    setRunning(true);
    setError(null);
    setOptimized(null);
    setAudit(null);
    setOptimizeDetail("");
    setStatuses(initialStatuses());

    try {
      setStep("ingest", "active");
      const ingestResponse = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          provider,
          html: provider === "paste" ? pasteHtml : undefined,
        }),
      });

      const ingestBody = await ingestResponse.json();
      if (!ingestResponse.ok) {
        throw new Error(ingestBody.message ?? "Ingestion failed.");
      }

      setStep("ingest", "completed");
      setStep("optimize", "active");

      const optimizeResponse = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ snapshot: ingestBody }),
      });

      if (!optimizeResponse.ok || !optimizeResponse.body) {
        const fallback = await optimizeResponse.json().catch(() => ({}));
        throw new Error(fallback.message ?? "Optimization failed.");
      }

      const reader = optimizeResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          const payload = JSON.parse(line.slice(5).trim()) as
            | OptimizeProgressEvent
            | { step: "done"; optimized: OptimizedListing; audit: Audit }
            | { step: "error"; message?: string };

          if (payload.step === "error") {
            throw new Error(payload.message ?? "Optimization stream failed.");
          }

          if (payload.step === "done" && "optimized" in payload) {
            setOptimized(payload.optimized);
            setAudit(payload.audit);
            setStep("optimize", "completed");
            setStep("verify", payload.audit.gateResult.pass ? "completed" : "error");
            setStep("audit", "completed");
            setOptimizeDetail(
              payload.audit.gateResult.pass ? "Gate passed" : "Gate reported blocking failures",
            );
            continue;
          }

          if ("status" in payload) {
            setOptimizeDetail(`${payload.step}: ${payload.status}`);
            if (payload.status === "error") {
              throw new Error(payload.message ?? `Failed during ${payload.step}`);
            }
          }
        }
      }
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : "Run failed.";
      setError(message);
      setStatuses((current) => {
        const next = { ...current };
        for (const step of PIPELINE) {
          if (next[step] === "active") next[step] = "error";
        }
        return next;
      });
    } finally {
      setRunning(false);
    }
  }, [pasteHtml, provider, setStep, url]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
        <header className="mb-8 border-b border-zinc-800 pb-6">
          <p className="text-sm font-medium uppercase tracking-wider text-orange-400">Internal tool</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Listing Optimizer</h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Ingest a listing, generate optimized copy, run the compliance gate, and review the audit delta.
          </p>
        </header>

        <InputPanel
          url={url}
          provider={provider}
          pasteHtml={pasteHtml}
          running={running}
          onUrlChange={setUrl}
          onProviderChange={setProvider}
          onPasteHtmlChange={setPasteHtml}
          onSubmit={runPipeline}
        />

        {(running || optimized) && (
          <ProgressSteps
            statuses={statuses}
            detail={optimizeDetail}
            className="mt-6"
          />
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {optimized && audit && (
          <ResultsView optimized={optimized} audit={audit} className="mt-8" />
        )}
      </div>
    </div>
  );
}
