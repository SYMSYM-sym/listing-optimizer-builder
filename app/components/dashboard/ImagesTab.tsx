"use client";

import { CopyButton } from "@/app/components/dashboard/CopyButton";
import type { OptimizedListing } from "@/lib/types";

type ImagesTabProps = {
  optimized: OptimizedListing;
};

export function ImagesTab({ optimized }: ImagesTabProps) {
  return (
    <div className="space-y-4">
      {optimized.imagePlan.map((slot) => {
        const text = `Slot ${slot.slot} (${slot.role})\nDescription: ${slot.description}\nSpecs: ${slot.specs}`;
        return (
          <section key={slot.slot} className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-zinc-200">
                  Slot {slot.slot} · {slot.role}
                </h3>
              </div>
              <CopyButton value={text} />
            </div>
            <p className="text-sm text-zinc-300">{slot.description}</p>
            <p className="mt-2 text-xs text-zinc-500">{slot.specs}</p>
          </section>
        );
      })}
      {optimized.imagePlan.length === 0 && (
        <p className="text-sm text-zinc-500">No image plan generated.</p>
      )}
    </div>
  );
}
