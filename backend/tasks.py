"""
tasks.py — CrewAI Task Definitions
Each task corresponds to one agent.  Tasks are assembled into a sequential
pipeline in crew.py.
"""
from __future__ import annotations

from crewai import Task
from agents import web_scraper_agent, synthesizer_agent, executive_writer_agent


def build_tasks(topic: str) -> tuple[Task, Task, Task]:
    """
    Build and return the three research tasks for the given topic.

    Returns:
        (search_task, synthesis_task, write_task)
    """
    scraper  = web_scraper_agent()
    synth    = synthesizer_agent()
    writer   = executive_writer_agent()

    # ------------------------------------------------------------------
    # Task 1 — Web Search & Raw Data Collection
    # ------------------------------------------------------------------
    search_task = Task(
        description=(
            f"Conduct a comprehensive web search on the topic: **{topic}**.\n\n"
            "Your deliverable must include:\n"
            "1. At least 8 distinct, relevant data points (statistics, "
            "   quotes, facts, figures, events).\n"
            "2. The URL / source name for each data point.\n"
            "3. A brief (1-sentence) note on why each source is credible.\n"
            "4. The approximate date/recency of each piece of information.\n\n"
            "Focus on: industry reports, reputable news outlets, academic "
            "sources, government data, and expert commentary published "
            "within the last 12 months where possible."
        ),
        expected_output=(
            "A structured list of 8–12 raw research findings, each with:\n"
            "- Finding: [the data point]\n"
            "- Source: [URL or publication name]\n"
            "- Credibility note: [1 sentence]\n"
            "- Recency: [date or 'within X months']\n"
        ),
        agent=scraper,
    )

    # ------------------------------------------------------------------
    # Task 2 — Data Synthesis & Trend Extraction
    # ------------------------------------------------------------------
    synthesis_task = Task(
        description=(
            f"Analyse the raw research findings provided about **{topic}**.\n\n"
            "Your deliverable must:\n"
            "1. Identify and articulate the 5–7 most significant trends or "
            "   themes emerging from the data.\n"
            "2. Cross-reference facts from multiple sources — call out any "
            "   contradictions or inconsistencies.\n"
            "3. Remove duplicate, outdated, or low-quality information.\n"
            "4. Assign a confidence level (High / Medium / Low) to each "
            "   trend, with a brief justification.\n"
            "5. Highlight 2–3 strategic implications for a business audience.\n"
            "6. Identify 1–2 key risk factors or counter-narratives.\n"
        ),
        expected_output=(
            "A structured analytical summary containing:\n"
            "- 5–7 numbered key trends with confidence levels\n"
            "- Cross-reference notes / fact-check results\n"
            "- 2–3 strategic implications\n"
            "- 1–2 risk factors / counter-narratives\n"
            "- Source quality assessment\n"
        ),
        agent=synth,
        context=[search_task],   # receives output of Task 1 as context
    )

    # ------------------------------------------------------------------
    # Task 3 — Executive Briefing Generation (Markdown)
    # ------------------------------------------------------------------
    write_task = Task(
        description=(
            f"Using the analytical summary about **{topic}**, produce a "
            "polished Corporate Intelligence Briefing in **GitHub-Flavored "
            "Markdown** format.\n\n"
            "The document MUST contain the following sections in order:\n\n"
            "1. `# 📋 Corporate Intelligence Briefing` — title with topic\n"
            "2. `## 🔍 Executive Summary` — 3–4 sentence top-level overview\n"
            "3. `## 📊 Key Findings` — 5–7 bullet points with sub-bullets "
            "   for supporting evidence\n"
            "4. `## 📈 Market Trends` — trend analysis with a Markdown table "
            "   (Trend | Confidence | Implication)\n"
            "5. `## ⚡ Strategic Implications` — numbered list of 2–3 "
            "   actionable insights\n"
            "6. `## ⚠️ Risk Factors` — 1–2 risks with mitigation notes\n"
            "7. `## 🔭 Forward Outlook` — 2–3 sentence projection for next "
            "   12–24 months\n"
            "8. `## 📚 Sources` — bulleted list of all cited sources\n\n"
            "Use `---` horizontal rules between major sections. Bold "
            "important terms. The tone must be confident and boardroom-ready."
        ),
        expected_output=(
            "A complete, well-formatted Corporate Intelligence Briefing in "
            "Markdown with all 8 required sections, a trends table, proper "
            "heading hierarchy, and source citations."
        ),
        agent=writer,
        context=[synthesis_task],   # receives output of Task 2 as context
    )

    return search_task, synthesis_task, write_task
