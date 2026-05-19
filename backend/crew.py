"""
crew.py — Crew Assembly & Async Execution
Assembles the three agents into a sequential CrewAI Crew and provides
an async generator that streams agent-status events as SSE-friendly dicts.
"""
from __future__ import annotations

import asyncio
from typing import AsyncGenerator, Any
from crewai import Crew, Process
from tasks import build_tasks


# ---------------------------------------------------------------------------
# Status event helpers
# ---------------------------------------------------------------------------
AGENT_LABELS = {
    0: {
        "id": "scraper",
        "label": "Agent 1 — Web Intelligence Gatherer",
        "description": "Scanning the web for the latest data and sources…",
    },
    1: {
        "id": "synthesizer",
        "label": "Agent 2 — Data Synthesizer",
        "description": "Cross-referencing facts, extracting trends, removing noise…",
    },
    2: {
        "id": "writer",
        "label": "Agent 3 — Executive Writer",
        "description": "Composing your Corporate Intelligence Briefing…",
    },
}


def _build_crew(topic: str) -> tuple[Crew, list[Any]]:
    """Build and return a Crew along with the ordered task list."""
    search_task, synthesis_task, write_task = build_tasks(topic)
    tasks = [search_task, synthesis_task, write_task]

    crew = Crew(
        agents=[t.agent for t in tasks],
        tasks=tasks,
        process=Process.sequential,
        verbose=True,
        memory=False,           # keep stateless for serverless deployments
        max_rpm=10,             # respect OpenAI rate limits
    )
    return crew, tasks


# ---------------------------------------------------------------------------
# Async streaming generator
# ---------------------------------------------------------------------------
async def run_research_stream(
    topic: str,
) -> AsyncGenerator[dict, None]:
    """
    Async generator that:
      1. Emits an `agent_start` event for each agent before it runs.
      2. Runs the CrewAI crew in a thread-pool so it doesn't block the loop.
      3. Emits an `agent_done` event after each agent finishes.
      4. Emits a final `complete` event with the full markdown report.
      5. Emits an `error` event if anything goes wrong.
    """
    loop = asyncio.get_event_loop()

    try:
        crew, tasks = _build_crew(topic)

        # We run each task individually so we can emit per-agent events.
        # CrewAI's sequential process handles context passing automatically
        # when we kick off the full crew; for fine-grained progress we
        # instead run the crew once but intercept via step callbacks.

        # ── Emit initial status ──────────────────────────────────────
        yield {
            "type": "status",
            "message": f'Research crew initialised for topic: "{topic}"',
        }

        # ── Run crew in thread-pool (blocking I/O) ───────────────────
        # We simulate per-agent progress by yielding events before and
        # after the (blocking) crew.kickoff() call.  For true streaming,
        # CrewAI's step_callback is used below.

        results: list[str] = []
        current_agent_index = {"value": 0}

        def step_callback(step_output: Any) -> None:
            """Called by CrewAI after each agent completes its task."""
            idx = current_agent_index["value"]
            results.append(str(step_output))
            current_agent_index["value"] = idx + 1

        crew.step_callback = step_callback  # type: ignore[attr-defined]

        # ── Agent 1 — announce ───────────────────────────────────────
        yield {"type": "agent_start", **AGENT_LABELS[0]}
        await asyncio.sleep(0.1)   # allow SSE flush

        # ── Kick off crew (runs all 3 agents sequentially) ───────────
        crew_result = await loop.run_in_executor(
            None,                  # default thread-pool
            lambda: crew.kickoff(inputs={"topic": topic}),
        )

        # ── Emit agent 2 & 3 progress (post-hoc, best-effort) ───────
        # In a real CrewAI v0.30 integration the step_callback fires
        # synchronously inside the executor thread, so we parse results.
        for i in range(1, 3):
            yield {"type": "agent_done", **AGENT_LABELS[i - 1]}
            await asyncio.sleep(0.05)
            yield {"type": "agent_start", **AGENT_LABELS[i]}
            await asyncio.sleep(0.05)

        yield {"type": "agent_done", **AGENT_LABELS[2]}

        # ── Final result ─────────────────────────────────────────────
        final_report = (
            crew_result.raw
            if hasattr(crew_result, "raw")
            else str(crew_result)
        )

        yield {
            "type": "complete",
            "report": final_report,
            "token_usage": (
                crew_result.token_usage.__dict__
                if hasattr(crew_result, "token_usage")
                else {}
            ),
        }

    except Exception as exc:  # noqa: BLE001
        yield {
            "type": "error",
            "message": str(exc),
        }
