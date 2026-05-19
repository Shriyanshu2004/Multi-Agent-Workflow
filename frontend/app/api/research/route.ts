import { NextRequest, NextResponse } from "next/server";

// This route handler proxies POST /api/research → FastAPI backend
// and forwards the SSE stream back to the browser client.

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { topic?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topic = body?.topic?.trim();
  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 422 });
  }

  // ── Forward to FastAPI ──────────────────────────────────────────────────
  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/research`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ topic }),
      // @ts-expect-error — Node fetch supports duplex streaming
      duplex: "half",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Backend unreachable";
    return NextResponse.json(
      { error: `Could not connect to research backend: ${message}` },
      { status: 502 }
    );
  }

  if (!backendRes.ok) {
    const text = await backendRes.text();
    return NextResponse.json(
      { error: `Backend error ${backendRes.status}: ${text}` },
      { status: backendRes.status }
    );
  }

  // ── Stream SSE through to the browser ──────────────────────────────────
  const { readable, writable } = new TransformStream();
  backendRes.body?.pipeTo(writable);

  return new NextResponse(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
