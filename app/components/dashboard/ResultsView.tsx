"use client";

import { useState } from "react";
import type { Audit, OptimizedListing } from "@/lib/types";
import { AplusTab } from "@/app/components/dashboard/AplusTab";
import { AuditTab } from "@/app/components/dashboard/AuditTab";
import { ExportBar } from "@/app/components/dashboard/ExportBar";
import { ImagesTab } from "@/app/components/dashboard/ImagesTab";
import { ListingTab } from "@/app/components/dashboard/ListingTab";
import { QaTab } from "@/app/components/dashboard/QaTab";

type TabId = "listing" | "aplus" | "images" | "qa" | "audit";

const TABS: { id: TabId; label: string }[] = [
  { id: "listing", label: "Listing" },
  { id: "aplus", label: "A+" },
  { id: "images", label: "Images" },
  { id: "qa", label: "Q&A" },
  { id: "audit", label: "Audit" },
];

type ResultsViewProps = {
  optimized: OptimizedListing;
  audit: Audit;
  className?: string;
};

export function ResultsView({ optimized, audit, className = "" }: ResultsViewProps) {
  const [tab, setTab] = useState<TabId>("listing");

  return (
    <section className={className}>
      <ExportBar optimized={optimized} audit={audit} />

      <div className="mt-6 border-b border-zinc-800">
        <nav className="-mb-px flex flex-wrap gap-1">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                tab === entry.id
                  ? "border border-b-0 border-zinc-700 bg-zinc-900 text-orange-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {entry.label}
              {entry.id === "audit" && !audit.verified && (
                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="rounded-b-xl rounded-tr-xl border border-zinc-800 bg-zinc-900/40 p-5">
        {tab === "listing" && <ListingTab optimized={optimized} audit={audit} />}
        {tab === "aplus" && <AplusTab optimized={optimized} />}
        {tab === "images" && <ImagesTab optimized={optimized} />}
        {tab === "qa" && <QaTab optimized={optimized} />}
        {tab === "audit" && <AuditTab audit={audit} />}
      </div>
    </section>
  );
}
