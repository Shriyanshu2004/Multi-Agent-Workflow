"""
tasks.py — CrewAI Task Definitions
"""
from __future__ import annotations

from crewai import Task
from agents import web_scraper_agent, synthesizer_agent, executive_writer_agent


def build_tasks(topic: str) -> tuple[Task, Task, Task]:
    scraper = web_scraper_agent()
    synth   = synthesizer_agent()
    writer  = executive_writer_agent()

    search_task = Task(
        description=(
            f"Search the web for the topic: {topic}. "
            "Find 4-5 key facts, statistics, or news with sources."
        ),
        expected_output=(
            "A list of 4-5 findings, each with: fact, source URL, and date."
        ),
        agent=scraper,
    )

    synthesis_task = Task(
        description=(
            f"Analyse the research findings about {topic}. "
            "Extract 3-4 key trends, assign confidence levels (High/Medium/Low), "
            "and note 1-2 strategic implications and 1 risk factor."
        ),
        expected_output=(
            "3-4 key trends with confidence levels, 1-2 implications, 1 risk factor."
        ),
        agent=synth,
        context=[search_task],
    )

    write_task = Task(
        description=(
            f"Write a Corporate Intelligence Briefing in Markdown about {topic}. "
            "Include: Executive Summary, Key Findings, Market Trends table, "
            "Strategic Implications, Risk Factors, Forward Outlook, Sources."
        ),
        expected_output=(
            "A complete Markdown briefing with all sections and a trends table."
        ),
        agent=writer,
        context=[synthesis_task],
    )

    return search_task, synthesis_task, write_task
