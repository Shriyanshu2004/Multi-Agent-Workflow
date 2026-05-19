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
    model = os.getenv("LLM_MODEL_NAME", "groq/llama-3.3-70b-versatile")
    max_tokens = int(os.getenv("LLM_MAX_TOKENS", "1024"))
    return LLM(
        model=model,
        temperature=0.3,
        max_tokens=max_tokens,
    )


# ---------------------------------------------------------------------------
# Agent 1 — Web Intelligence Gatherer
# ---------------------------------------------------------------------------
def web_scraper_agent() -> Agent:
    """Senior Research Analyst who trawls the web for authoritative information."""
    return Agent(
        role="Senior Research Analyst",
        goal=(
            "Search the web to gather the most recent and credible data, "
            "statistics, expert opinions, and news about the given research "
            "topic. Retrieve at least 5 distinct data points with sources."
        ),
        backstory=(
            "You are a veteran intelligence analyst skilled at finding "
            "high-signal information quickly. You are methodical, cite "
            "sources, and never fabricate data."
        ),
        tools=[search_tool],
        llm=_build_llm(),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )


# ---------------------------------------------------------------------------
# Agent 2 — Data Synthesizer
# ---------------------------------------------------------------------------
def synthesizer_agent() -> Agent:
    """Intelligence Analyst who transforms raw search results into structured insights."""
    return Agent(
        role="Intelligence Analyst",
        goal=(
            "Analyse the raw research data. Extract the top 4-5 key trends, "
            "cross-reference facts, and produce a structured analytical "
            "summary with insights and confidence levels (High/Medium/Low)."
        ),
        backstory=(
            "You are a strategic analyst known for turning raw data into "
            "focused insights. You are rigorous, structured, and concise."
        ),
        tools=[],
        llm=_build_llm(),
        verbose=True,
        allow_delegation=False,
        max_iter=2,
    )


# ---------------------------------------------------------------------------
# Agent 3 — Executive Writer
# ---------------------------------------------------------------------------
def executive_writer_agent() -> Agent:
    """Corporate Communications Director who writes boardroom-ready briefings."""
    return Agent(
        role="Corporate Communications Director",
        goal=(
            "Transform the analytical summary into a polished Corporate "
            "Intelligence Briefing in Markdown. Include: Executive Summary, "
            "Key Findings, Market Trends, Strategic Implications, Risk "
            "Factors, and Forward Outlook. Use bold headings and bullet points."
        ),
        backstory=(
            "You are a Chief Communications Officer who writes clear, "
            "concise briefings that shape strategic decisions. Every word "
            "earns its place."
        ),
        tools=[],
        llm=_build_llm(),
        verbose=True,
        allow_delegation=False,
        max_iter=2,
    )
