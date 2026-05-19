"""
crew.py — Crew Assembly & Async Execution (CrewAI 1.x)
Assembles the three agents into a sequential CrewAI Crew and provides
an async generator that streams agent-status events as SSE-friendly dicts.

CrewAI 1.x changes:
  - crew.kickoff() returns a CrewOutput object with .raw attribute
  - step_callback receives a TaskOutput object
  - Process enum is still available the same way
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
        memory=False,
        max_rpm=10,
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
      1. Emits status/agent events before and after the crew runs.
      2. Runs the CrewAI crew in a thread-pool (blocking I/O).
      3. Emits a final `complete` event with the full markdown report.
      4. Emits an `error` event if anything goes wrong.
    """
    loop = asyncio.get_event_loop()

    try:
        crew, tasks = _build_crew(topic)

        # ── Emit initial status ──────────────────────────────────────
        yield {
            "type": "status",
            "message": f'Research crew initialised for topic: "{topic}"',
        }
        await asyncio.sleep(0.1)

        # ── Track completed task count via step_callback ─────────────
        completed: list[int] = []

        def step_callback(task_output: Any) -> None:
            idx = len(completed)
            completed.append(idx)

        crew.task_callback = step_callback  # type: ignore[attr-defined]

        # ── Announce Agent 1 starting ────────────────────────────────
        yield {"type": "agent_start", **AGENT_LABELS[0]}
        await asyncio.sleep(0.05)

        # ── Run crew in thread-pool ──────────────────────────────────
        crew_result = await loop.run_in_executor(
            None,
            lambda: crew.kickoff(inputs={"topic": topic}),
        )

        # ── Emit completion for agents 1→3 ───────────────────────────
        yield {"type": "agent_done", **AGENT_LABELS[0]}
        await asyncio.sleep(0.05)

        yield {"type": "agent_start", **AGENT_LABELS[1]}
        await asyncio.sleep(0.05)
        yield {"type": "agent_done", **AGENT_LABELS[1]}
        await asyncio.sleep(0.05)

        yield {"type": "agent_start", **AGENT_LABELS[2]}
        await asyncio.sleep(0.05)
        yield {"type": "agent_done", **AGENT_LABELS[2]}

        # ── Extract final report ─────────────────────────────────────
        # CrewAI 1.x: CrewOutput.raw contains the last task's string output
        if hasattr(crew_result, "raw"):
            final_report = crew_result.raw
        else:
            final_report = str(crew_result)

        # ── Token usage (available in 1.x via usage_metrics) ─────────
        token_usage: dict = {}
        if hasattr(crew_result, "usage_metrics") and crew_result.usage_metrics:
            um = crew_result.usage_metrics
            token_usage = um if isinstance(um, dict) else vars(um)

        yield {
            "type": "complete",
            "report": final_report,
            "token_usage": token_usage,
        }

    except Exception as exc:  # noqa: BLE001
        yield {
            "type": "error",
            "message": str(exc),
        }
