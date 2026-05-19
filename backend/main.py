"""
main.py — FastAPI Application Entry-Point
Exposes:
  POST /api/research  →  Server-Sent Events stream of agent progress + report
  GET  /health        →  Liveness check
"""
from __future__ import annotations

import json
import os

# Must be set before litellm is imported anywhere
os.environ["LITELLM_DROP_PARAMS"] = "True"

from dotenv import load_dotenv
load_dotenv()

# Patch litellm to strip cache_breakpoint from messages (unsupported by Groq)
try:
    import litellm
    litellm.drop_params = True

    _original_completion = litellm.completion

    def _patched_completion(*args, **kwargs):
        messages = kwargs.get("messages", [])
        for msg in messages:
            msg.pop("cache_breakpoint", None)
            if isinstance(msg.get("content"), list):
                for block in msg["content"]:
                    if isinstance(block, dict):
                        block.pop("cache_breakpoint", None)
        kwargs["messages"] = messages
        return _original_completion(*args, **kwargs)

    litellm.completion = _patched_completion
except Exception:
    pass

from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from crew import run_research_stream  # noqa: E402

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Multi-Agent Research System API",
    description=(
        "CrewAI-powered research pipeline: web scraping → synthesis → "
        "executive briefing, streamed over Server-Sent Events."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ────────────────────────────────────────────────────────────────────
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000",
)
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class ResearchRequest(BaseModel):
    topic: str = Field(
        ...,
        min_length=3,
        max_length=300,
        description="The research topic or industry to investigate.",
        examples=["AI in Healthcare 2025"],
    )


# ---------------------------------------------------------------------------
# SSE helpers
# ---------------------------------------------------------------------------
def _sse_event(data: dict) -> str:
    """Serialise a dict to an SSE `data:` line."""
    return f"data: {json.dumps(data)}\n\n"


async def _event_generator(topic: str) -> AsyncGenerator[str, None]:
    """Wrap run_research_stream() into SSE-formatted text chunks."""
    async for event in run_research_stream(topic):
        yield _sse_event(event)
    # Signal stream end
    yield _sse_event({"type": "stream_end"})


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health", tags=["ops"])
async def health_check() -> dict:
    """Liveness probe — Vercel & Docker health checks hit this."""
    return {"status": "ok", "service": "multi-agent-research-api"}


@app.post(
    "/api/research",
    summary="Start a research run (SSE stream)",
    response_description="Server-Sent Events stream of agent progress and final report",
    tags=["research"],
)
async def start_research(request: ResearchRequest) -> StreamingResponse:
    """
    Kick off the 3-agent CrewAI pipeline for the given **topic**.

    The response is a `text/event-stream` (SSE) with JSON payloads:

    | `type`        | Fields                                   |
    |---------------|------------------------------------------|
    | `status`      | `message`                                |
    | `agent_start` | `id`, `label`, `description`             |
    | `agent_done`  | `id`, `label`, `description`             |
    | `complete`    | `report` (Markdown string), `token_usage`|
    | `error`       | `message`                                |
    | `stream_end`  | *(sentinel — no additional fields)*      |
    """
    topic = request.topic.strip()
    if not topic:
        raise HTTPException(status_code=422, detail="Topic cannot be empty.")

    return StreamingResponse(
        _event_generator(topic),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # disable Nginx/proxy buffering
            "Connection": "keep-alive",
        },
    )


# ---------------------------------------------------------------------------
# Local dev entry-point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("BACKEND_PORT", "8000")),
        reload=True,
        log_level="info",
    )
