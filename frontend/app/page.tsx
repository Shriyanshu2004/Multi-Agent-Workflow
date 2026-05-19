"use client";

import { useState, useCallback, useRef } from "react";
import { createParser, type ParsedEvent } from "eventsource-parser";
import ResearchForm from "@/components/ResearchForm";
import AgentStatusPanel from "@/components/AgentStatusPanel";
import MarkdownReport from "@/components/MarkdownReport";
import type {
  ResearchEvent,
  AgentInfo,
  ResearchPhase,
} from "@/lib/types";
import { AlertCircle, RefreshCw, Zap } from "lucide-react";

// ── Initial agent state ─────────────────────────────────────────────────────
const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: "scraper",
    label: "Agent 1 — Web Intelligence Gatherer",
    description: "Scanning the web for the latest data and sources…",
    status: "pending",
  },
  {
    id: "synthesizer",
    label: "Agent 2 — Data Synthesizer",
    description: "Cross-referencing facts, extracting trends, removing noise…",
    status: "pending",
  },
  {
    id: "writer",
    label: "Agent 3 — Executive Writer",
    description: "Composing your Corporate Intelligence Briefing…",
    status: "pending",
  },
];

// ── Animated background orbs ────────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl animate-pulse-slow" />
      <div
        className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl animate-pulse-slow"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-pink-600/8 blur-3xl animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      />
      {/* Mesh grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

// ── Stats row ───────────────────────────────────────────────────────────────
function StatsRow() {
  const stats = [
    { label: "Agents", value: "3", icon: "🤖" },
    { label: "Search Results", value: "10+", icon: "🔍" },
    { label: "Output Format", value: "Markdown", icon: "📋" },
    { label: "Avg. Time", value: "~45s", icon: "⚡" },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-12">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm"
        >
          <span>{s.icon}</span>
          <span className="text-white font-semibold">{s.value}</span>
          <span className="text-slate-500">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [phase, setPhase] = useState<ResearchPhase>("idle");
  const [agents, setAgents] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [statusMessage, setStatusMessage] = useState("");
  const [report, setReport] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<Record<string, number>>({});
  const abortRef = useRef<AbortController | null>(null);

  // ── Reset state ─────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
    setAgents(INITIAL_AGENTS);
    setStatusMessage("");
    setReport(null);
    setErrorMessage(null);
    setTokenUsage({});
  }, []);

  // ── Update a single agent's status ─────────────────────────────────────
  const updateAgent = useCallback(
    (id: string, status: AgentInfo["status"]) => {
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    },
    []
  );

  // ── SSE event handler ───────────────────────────────────────────────────
  const handleEvent = useCallback(
    (event: ResearchEvent) => {
      switch (event.type) {
        case "status":
          setStatusMessage(event.message);
          break;
        case "agent_start":
          updateAgent(event.id, "active");
          setStatusMessage(`${event.label}: ${event.description}`);
          break;
        case "agent_done":
          updateAgent(event.id, "done");
          break;
        case "complete":
          setReport(event.report);
          setTokenUsage(event.token_usage ?? {});
          setPhase("complete");
          setStatusMessage("");
          // Mark all agents done
          setAgents((prev) => prev.map((a) => ({ ...a, status: "done" })));
          break;
        case "error":
          setErrorMessage(event.message);
          setPhase("error");
          setStatusMessage("");
          // Mark active agents as errored
          setAgents((prev) =>
            prev.map((a) =>
              a.status === "active" ? { ...a, status: "error" } : a
            )
          );
          break;
        case "stream_end":
          // Handled by complete event — no-op here
          break;
      }
    },
    [updateAgent]
  );

  // ── Start research ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (topic: string) => {
      reset();
      // tiny delay so reset animation plays
      await new Promise((r) => setTimeout(r, 50));

      setPhase("running");
      setAgents(INITIAL_AGENTS);

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
          signal: ctrl.signal,
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? `HTTP ${res.status}`);
        }

        if (!res.body) throw new Error("No response body from server.");

        // ── Parse SSE stream ──────────────────────────────────────────
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const parser = createParser((e: ParsedEvent) => {
          if (e.type === "event" || e.data) {
            try {
              const parsed = JSON.parse(e.data) as ResearchEvent;
              handleEvent(parsed);
            } catch {
              // ignore malformed events
            }
          }
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parser.feed(decoder.decode(value, { stream: true }));
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setErrorMessage(
          err instanceof Error ? err.message : "An unknown error occurred."
        );
        setPhase("error");
        setStatusMessage("");
      }
    },
    [reset, handleEvent]
  );

  const isLoading = phase === "running";

  return (
    <main className="relative min-h-screen flex flex-col">
      <BackgroundOrbs />

      {/* ── Content wrapper ── */}
      <div className="relative z-10 flex-1 flex flex-col px-4 py-12 sm:py-20">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-10">

          {/* ── Top nav badge ── */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <Zap size={16} className="text-brand-400" />
              <span>ResearchAI</span>
            </div>
            <a
              href="https://github.com/Shriyanshu2004/Multi-Agent-Workflow"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 border border-white/[0.07] rounded-lg px-3 py-1.5 hover:border-white/20"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>

          {/* ── Stats ── */}
          {phase === "idle" && <StatsRow />}

          {/* ── Search Form ── */}
          <ResearchForm onSubmit={handleSubmit} isLoading={isLoading} />

          {/* ── Agent Progress ── */}
          {(isLoading || phase === "error") && agents.some(a => a.status !== "pending") && (
            <AgentStatusPanel agents={agents} statusMessage={statusMessage} />
          )}

          {/* ── Error state ── */}
          {phase === "error" && errorMessage && (
            <div className="w-full max-w-3xl mx-auto glass-card p-5 border-red-500/30 bg-red-500/5 animate-fade-in-up">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-300 mb-1">Research Failed</p>
                  <p className="text-xs text-red-400/80 font-mono break-all">{errorMessage}</p>
                </div>
              </div>
              <button
                id="retry-btn"
                onClick={reset}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/[0.07] transition-all"
              >
                <RefreshCw size={13} />
                Try Again
              </button>
            </div>
          )}

          {/* ── Agent Panel (complete state — collapsed) ── */}
          {phase === "complete" && (
            <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
              <div className="flex items-center gap-3 p-4 glass-card border-emerald-500/20 bg-emerald-500/5">
                <div className="flex gap-1.5">
                  {agents.map((a) => (
                    <span key={a.id} className="text-base">✅</span>
                  ))}
                </div>
                <p className="text-sm text-emerald-300 font-medium">
                  All 3 agents completed — briefing ready below
                </p>
                <button
                  onClick={reset}
                  className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <RefreshCw size={12} />
                  New Research
                </button>
              </div>
            </div>
          )}

          {/* ── Markdown Report ── */}
          {phase === "complete" && report && (
            <MarkdownReport report={report} tokenUsage={tokenUsage} />
          )}

          {/* ── Footer ── */}
          <footer className="text-center text-xs text-slate-600 mt-8 pb-4">
            Built with CrewAI · Next.js 14 · FastAPI · OpenAI · Serper
          </footer>
        </div>
      </div>
    </main>
  );
}
