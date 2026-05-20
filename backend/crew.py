"""
crew.py — Crew Assembly & Async Execution (CrewAI 1.x)
"""
from __future__ import annotations

import asyncio
import queue
import threading
from typing import AsyncGenerator, Any
from crewai import Crew, Process
from tasks import build_tasks

AGENT_LABELS = {
    0: {"id": "scraper",      "label": "Agent 1 — Web Intelligence Gatherer",  "description": "Scanning the web for the latest data and sources…"},
    1: {"id": "synthesizer",  "label": "Agent 2 — Data Synthesizer",            "description": "Cross-referencing facts, extracting trends, removing noise…"},
    2: {"id": "writer",       "label": "Agent 3 — Executive Writer",            "description": "Composing your Corporate Intelligence Briefing…"},
}

AGENT_ID_BY_ROLE = {
    "Senior Research Analyst":          "scraper",
    "Intelligence Analyst":             "synthesizer",
    "Corporate Communications Director":"writer",
}


def _build_crew(topic: str, thought_queue: queue.Queue) -> tuple[Crew, list[Any]]:
    search_task, synthesis_task, write_task = build_tasks(topic)
    tasks = [search_task, synthesis_task, write_task]

    # ── Step callback — fires on every LLM reasoning step ──────────────
    def step_callback(agent_output: Any) -> None:
        try:
            # agent_output may be AgentAction or AgentFinish
            role = getattr(getattr(agent_output, "agent", None), "role", None)
            agent_id = AGENT_ID_BY_ROLE.get(role or "", "scraper")

            # Extract thought text
            thought = None
            if hasattr(agent_output, "thought"):
                thought = str(agent_output.thought)
            elif hasattr(agent_output, "log"):
                thought = str(agent_output.log)
            elif hasattr(agent_output, "text"):
                thought = str(agent_output.text)
            elif hasattr(agent_output, "return_values"):
                thought = str(agent_output.return_values)

            if thought and thought.strip():
                thought_queue.put({"type": "thought", "agent_id": agent_id, "text": thought.strip()[:300]})
        except Exception:
            pass

    # ── Task callback — fires when each task completes ──────────────────
    task_idx = [0]
    def task_callback(task_output: Any) -> None:
        idx = task_idx[0]
        if idx < len(AGENT_LABELS):
            thought_queue.put({"type": "thought", "agent_id": AGENT_LABELS[idx]["id"],
                               "text": f"✅ Task complete. Output ready for next agent."})
        task_idx[0] += 1

    crew = Crew(
        agents=[t.agent for t in tasks],
        tasks=tasks,
        process=Process.sequential,
        verbose=False,
        memory=False,
        max_rpm=10,
        step_callback=step_callback,
        task_callback=task_callback,
    )
    return crew, tasks


async def run_research_stream(topic: str) -> AsyncGenerator[dict, None]:
    loop = asyncio.get_event_loop()
    thought_queue: queue.Queue = queue.Queue()
    done_event = threading.Event()

    try:
        crew, tasks = _build_crew(topic, thought_queue)

        yield {"type": "status", "message": f'Research crew initialised for topic: "{topic}"'}
        await asyncio.sleep(0.1)

        yield {"type": "agent_start", **AGENT_LABELS[0]}
        await asyncio.sleep(0.05)

        # ── Run crew in background thread ────────────────────────────
        result_holder: list = []
        error_holder: list = []

        def run_crew():
            try:
                result = crew.kickoff(inputs={"topic": topic})
                result_holder.append(result)
            except Exception as e:
                error_holder.append(e)
            finally:
                done_event.set()

        thread = threading.Thread(target=run_crew, daemon=True)
        thread.start()

        # ── Stream thoughts while crew runs ──────────────────────────
        current_agent_idx = 0
        while not done_event.is_set() or not thought_queue.empty():
            # Drain thought queue
            drained = 0
            while not thought_queue.empty() and drained < 5:
                try:
                    event = thought_queue.get_nowait()
                    # Detect agent transitions
                    if event["type"] == "thought":
                        agent_id = event["agent_id"]
                        expected_id = AGENT_LABELS[current_agent_idx]["id"]
                        if agent_id != expected_id and current_agent_idx < 2:
                            # Agent changed — emit done/start events
                            yield {"type": "agent_done", **AGENT_LABELS[current_agent_idx]}
                            current_agent_idx += 1
                            yield {"type": "agent_start", **AGENT_LABELS[current_agent_idx]}
                            await asyncio.sleep(0.05)
                    yield event
                    drained += 1
                except queue.Empty:
                    break

            await asyncio.sleep(0.1)

        # ── Emit remaining agent done events ─────────────────────────
        while current_agent_idx < len(AGENT_LABELS):
            yield {"type": "agent_done", **AGENT_LABELS[current_agent_idx]}
            current_agent_idx += 1
            if current_agent_idx < len(AGENT_LABELS):
                yield {"type": "agent_start", **AGENT_LABELS[current_agent_idx]}
                await asyncio.sleep(0.05)

        if error_holder:
            raise error_holder[0]

        crew_result = result_holder[0]
        final_report = crew_result.raw if hasattr(crew_result, "raw") else str(crew_result)

        token_usage: dict = {}
        if hasattr(crew_result, "usage_metrics") and crew_result.usage_metrics:
            um = crew_result.usage_metrics
            token_usage = um if isinstance(um, dict) else vars(um)

        yield {"type": "complete", "report": final_report, "token_usage": token_usage}

    except Exception as exc:
        yield {"type": "error", "message": str(exc)}


async def run_comparison_stream(topic1: str, topic2: str) -> AsyncGenerator[dict, None]:
    """Run two research crews in parallel and stream both results."""
    loop = asyncio.get_event_loop()

    yield {"type": "status", "message": f'Comparing "{topic1}" vs "{topic2}"…'}
    await asyncio.sleep(0.1)

    async def run_single(topic: str, slot: str):
        results = []
        async for event in run_research_stream(topic):
            event["slot"] = slot
            results.append(event)
        return results

    # Run both in parallel
    results1, results2 = await asyncio.gather(
        run_single(topic1, "left"),
        run_single(topic2, "right"),
    )

    # Interleave and yield
    for event in results1 + results2:
        yield event

    yield {"type": "stream_end"}
