"use client";

import { utf8Bytes } from "@/lib/gate/util";
import { FIELD_LIMITS } from "@/lib/knowledge/fieldLimits";
import type { Audit, OptimizedListing } from "@/lib/types";
import { FieldCard } from "@/app/components/dashboard/FieldCard";

type ListingTabProps = {
  optimized: OptimizedListing;
  audit: Audit;
};

function gateFailedOn(audit: Audit, field: string): boolean {
  return audit.gateResult.failures.some(
    (failure) =>
      failure.field === field ||
      field.startsWith(`${failure.field}.`) ||
      failure.field.startsWith(`${field}.`) ||
      (failure.field === "bullets" && field.startsWith("bullet")),
  );
}

export function ListingTab({ optimized, audit }: ListingTabProps) {
  return (
    <div className="space-y-4">
      <FieldCard
        label="Title"
        value={optimized.title}
        limit={FIELD_LIMITS.title}
        gateFailed={gateFailedOn(audit, "title")}
      />
      <FieldCard
        label="Title 75"
        value={optimized.title75}
        limit={FIELD_LIMITS.title75}
        gateFailed={gateFailedOn(audit, "title75")}
      />
      <FieldCard
        label="Item highlights"
        value={optimized.itemHighlights}
        limit={FIELD_LIMITS.itemHighlights}
        gateFailed={gateFailedOn(audit, "itemHighlights")}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {optimized.bullets.map((bullet, index) => (
          <FieldCard
            key={index}
            label={`Bullet ${index + 1}`}
            value={bullet}
            limit={FIELD_LIMITS.bulletMax}
            gateFailed={gateFailedOn(audit, `bullet${index}`)}
          />
        ))}
      </div>

      <FieldCard
        label="Description"
        value={optimized.description}
        limit={FIELD_LIMITS.description}
        gateFailed={gateFailedOn(audit, "description")}
      />

      <FieldCard
        label="Backend search terms"
        value={optimized.backendSearchTerms}
        limit={FIELD_LIMITS.backendMaxBytes}
        mode="bytes"
        measure={utf8Bytes(optimized.backendSearchTerms)}
        gateFailed={gateFailedOn(audit, "backendSearchTerms")}
        monospace
      />

      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-300">Attributes</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(optimized.attributes).map(([field, value]) => (
            <FieldCard
              key={field}
              label={field}
              value={value}
              limit={500}
              gateFailed={gateFailedOn(audit, `attributes.${field}`)}
              monospace
            />
          ))}
        </div>
      </div>
    </div>
  );
}
