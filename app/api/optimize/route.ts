import { NextResponse } from "next/server";
import { optimize, type OptimizeProgress } from "@/lib/engine/optimize";
import type { KnowledgePackId, ListingSnapshot } from "@/lib/types";

export const runtime = "nodejs";

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

  const wantsStream = request.headers.get("accept")?.includes("text/event-stream");

  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (payload: OptimizeProgress | { step: "done"; listing: unknown }) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        try {
          const listing = await optimize({
            snapshot: body.snapshot!,
            packId: body.packId,
            onProgress: (event) => send(event),
          });
          send({ step: "done", listing });
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
    const listing = await optimize({
      snapshot: body.snapshot,
      packId: body.packId,
    });
    return NextResponse.json(listing);
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
