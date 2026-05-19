"""
tools.py — CrewAI Tool Definitions
Wraps SerperDevTool for Google Search.  Additional tools (e.g. web scraper,
PDF reader) can be registered here and passed into agents in agents.py.
"""
from __future__ import annotations

import os
from crewai_tools import SerperDevTool

# ---------------------------------------------------------------------------
# Primary search tool — powered by Serper.dev (Google Search API wrapper)
# Serper free tier: 2,500 searches / month, response <1 s
# ---------------------------------------------------------------------------

def get_search_tool(n_results: int = 10) -> SerperDevTool:
    """
    Return a configured SerperDevTool instance.

    Args:
        n_results: How many search results to return per query (default 10).

    Env:
        SERPER_API_KEY: must be set in the environment.
    """
    serper_key = os.getenv("SERPER_API_KEY")
    if not serper_key:
        raise EnvironmentError(
            "SERPER_API_KEY is not set. "
            "Get a free key at https://serper.dev and add it to .env"
        )

    tool = SerperDevTool(n_results=n_results)
    return tool


# ---------------------------------------------------------------------------
# Export a singleton for convenience
# ---------------------------------------------------------------------------
search_tool = get_search_tool(n_results=3)
