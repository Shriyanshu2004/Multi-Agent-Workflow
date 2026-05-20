import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { topic1?: string; topic2?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const topic1 = body?.topic1?.trim();
  const topic2 = body?.topic2?.trim();
  if (!topic1 || !topic2) {
    return NextResponse.json({ error: "Both topics are required" }, { status: 422 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ topic1, topic2 }),
      // @ts-expect-error — Node fetch supports duplex streaming
      duplex: "half",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Backend unreachable";
    return NextResponse.json({ error: `Could not connect to research backend: ${message}` }, { status: 502 });
  }

  if (!backendRes.ok) {
    const text = await backendRes.text();
    return NextResponse.json({ error: `Backend error ${backendRes.status}: ${text}` }, { status: backendRes.status });
  }

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
