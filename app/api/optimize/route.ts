import { NextResponse } from "next/server";
import { buildAudit } from "@/lib/audit/buildAudit";
import { detectCategory } from "@/lib/knowledge/detectCategory";
import { loadPack } from "@/lib/knowledge/loadPack";
import { optimizeWithRepair } from "@/lib/engine/repair";
import type { OptimizeProgress } from "@/lib/engine/optimize";
import type { KnowledgePackId, ListingSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

type OptimizeRequestBody = {
  snapshot?: ListingSnapshot;
  packId?: KnowledgePackId;
};

function isValidSnapshot(value: unknown): value is ListingSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as ListingSnapshot;
  return typeof snapshot.asin === "string" && typeof snapshot.title === "string";
}

export async function POST(request: Request) {
  let body: OptimizeRequestBody;
  try {
    body = (await request.json()) as OptimizeRequestBody;
  } catch {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isValidSnapshot(body.snapshot)) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "A valid snapshot object is required." },
      { status: 400 },
    );
  }

  const snapshot = body.snapshot;
  const detection = detectCategory(snapshot);
  const packId = body.packId ?? detection.packId;
  const pack = loadPack(packId);
  const wantsStream = request.headers.get("accept")?.includes("text/event-stream");

  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (
          payload: OptimizeProgress | { step: "done"; optimized: unknown; audit: unknown },
        ) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        try {
          const result = await optimizeWithRepair({
            snapshot,
            packId,
            onProgress: (event) => send(event),
          });
          const audit = buildAudit({
            current: snapshot,
            proposed: result.listing,
            pack,
            subcategory: detection.subcategory,
            productName: result.listing.title.split(/\s+/).slice(0, 2).join(" "),
            gateResult: result.gateResult,
          });
          send({ step: "done", optimized: result.listing, audit });
          controller.close();
        } catch (error) {
          send({
            step: "error",
            status: "error",
            message: error instanceof Error ? error.message : "Optimization failed.",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  try {
    const result = await optimizeWithRepair({ snapshot, packId });
    const audit = buildAudit({
      current: snapshot,
      proposed: result.listing,
      pack,
      subcategory: detection.subcategory,
      gateResult: result.gateResult,
    });
    return NextResponse.json({ optimized: result.listing, audit });
  } catch (error) {
    return NextResponse.json(
      {
        error: "OPTIMIZE_ERROR",
        message: error instanceof Error ? error.message : "Optimization failed.",
      },
      { status: 502 },
    );
  }
}
