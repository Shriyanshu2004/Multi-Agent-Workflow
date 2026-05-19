"""
agents.py — CrewAI 1.x Agent Definitions
Three specialized agents working sequentially:
  1. Web Intelligence Gatherer  → searches the web via Serper
  2. Data Synthesizer           → analyzes and structures raw results
  3. Executive Writer           → produces the final markdown briefing

CrewAI 1.x uses its own LLM class with provider/model strings.
"""
from __future__ import annotations

import os
from crewai import Agent, LLM
from tools import search_tool


# ---------------------------------------------------------------------------
# LLM configuration — shared across all agents
# ---------------------------------------------------------------------------
def _build_llm() -> LLM:
    model = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")
    return LLM(
        model=f"openai/{model}",
        temperature=0.3,
        max_tokens=4096,
    )


# ---------------------------------------------------------------------------
# Agent 1 — Web Intelligence Gatherer
# ---------------------------------------------------------------------------
def web_scraper_agent() -> Agent:
    """Senior Research Analyst who trawls the web for authoritative information."""
    return Agent(
        role="Senior Research Analyst",
        goal=(
            "Conduct exhaustive, multi-angle web searches to gather the most "
            "recent and credible data, statistics, expert opinions, and news "
            "about the given research topic. Prioritise sources published in "
            "the last 12 months. Retrieve at least 8 distinct data points."
        ),
        backstory=(
            "You are a veteran intelligence analyst who spent 15 years at a "
            "top-tier geopolitical research firm. You have an uncanny ability "
            "to cut through noise and surface only the highest-signal "
            "information. You are methodical, cite sources, and never "
            "fabricate data."
        ),
        tools=[search_tool],
        llm=_build_llm(),
        verbose=True,
        allow_delegation=False,
        max_iter=5,
    )


# ---------------------------------------------------------------------------
# Agent 2 — Data Synthesizer
# ---------------------------------------------------------------------------
def synthesizer_agent() -> Agent:
    """Intelligence Analyst who transforms raw search results into structured insights."""
    return Agent(
        role="Intelligence Analyst",
        goal=(
            "Analyse the raw research data provided by the Web Intelligence "
            "Gatherer. Extract the top 5–7 key trends, cross-reference facts "
            "across multiple sources to validate them, eliminate duplicate or "
            "low-quality information, and produce a structured analytical "
            "summary with clearly delineated insights, supporting evidence, "
            "and confidence levels (High / Medium / Low)."
        ),
        backstory=(
            "You are a data scientist turned strategic analyst. You have "
            "published peer-reviewed papers on information extraction and "
            "text synthesis. You are known for turning a mountain of raw data "
            "into laser-focused insights that executives act on. You are "
            "rigorous, structured, and allergic to vague language."
        ),
        tools=[],
        llm=_build_llm(),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )


# ---------------------------------------------------------------------------
# Agent 3 — Executive Writer
# ---------------------------------------------------------------------------
def executive_writer_agent() -> Agent:
    """Corporate Communications Director who writes boardroom-ready briefings."""
    return Agent(
        role="Corporate Communications Director",
        goal=(
            "Transform the structured analytical summary into a polished, "
            "professional Corporate Intelligence Briefing in Markdown format. "
            "The document must include: an Executive Summary, Key Findings "
            "(with bullet points and sub-bullets), Market Trends section, "
            "Strategic Implications, Risk Factors, and a Forward Outlook. "
            "Use bold headings, horizontal rules, emoji section markers, and "
            "structured tables where appropriate. The tone must be confident, "
            "concise, and boardroom-ready."
        ),
        backstory=(
            "You are a former McKinsey engagement manager turned Chief "
            "Communications Officer for a Fortune 100 company. You have "
            "written briefings that shaped billion-dollar strategic decisions. "
            "Your documents are models of clarity — every word earns its "
            "place, every section flows into the next, and the reader always "
            "leaves knowing exactly what to think and do next."
        ),
        tools=[],
        llm=_build_llm(),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )
