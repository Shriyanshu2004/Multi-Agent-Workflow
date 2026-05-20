"use client";

import { useState, useCallback, useRef } from "react";
import ResearchForm from "@/components/ResearchForm";
import AgentStatusPanel from "@/components/AgentStatusPanel";
import MarkdownReport from "@/components/MarkdownReport";
import ResearchHistory, { saveToHistory, type HistoryEntry } from "@/components/ResearchHistory";
import type { ResearchEvent, AgentInfo, ResearchPhase } from "@/lib/types";
import { AlertCircle, RefreshCw, Zap, GitCompare } from "lucide-react";

const INITIAL_AGENTS: AgentInfo[] = [
  { id: "scraper",      label: "Agent 1 — Web Intelligence Gatherer",  description: "Scanning the web for the latest data and sources…",          status: "pending", thoughts: [] },
  { id: "synthesizer",  label: "Agent 2 — Data Synthesizer",            description: "Cross-referencing facts, extracting trends, removing noise…", status: "pending", thoughts: [] },
  { id: "writer",       label: "Agent 3 — Executive Writer",            description: "Composing your Corporate Intelligence Briefing…",             status: "pending", thoughts: [] },
];

function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/3 -right-40 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-pink-600/8 blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
    </div>
  );
}

function StatsRow() {
  const stats = [
    { label: "Agents", value: "3", icon: "🤖" },
    { label: "Live Thoughts", value: "Real-time", icon: "🧠" },
    { label: "Output Format", value: "Markdown", icon: "📋" },
    { label: "Compare Mode", value: "2 Topics", icon: "⚡" },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-12">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-sm">
          <span>{s.icon}</span>
          <span className="text-white font-semibold">{s.value}</span>
          <span className="text-slate-500">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Compare Form ─────────────────────────────────────────────────────────────
function CompareForm({ onSubmit, isLoading }: { onSubmit: (t1: string, t2: string) => void; isLoading: boolean }) {
  const [topic1, setTopic1] = useState("");
  const [topic2, setTopic2] = useState("");

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-700/50 bg-purple-950/50 text-purple-300 text-xs font-medium mb-4">
          <GitCompare size={12} />
          Compare Mode — Two Topics, Side by Side
        </div>
        <p className="text-slate-400 text-sm">Enter two topics to get a parallel intelligence briefing</p>
      </div>
      <div className="flex flex-col gap-3">
        <input
          type="text" value={topic1} onChange={(e) => setTopic1(e.target.value)}
          placeholder="Topic 1 — e.g. Tesla EV Strategy"
          disabled={isLoading}
          className="input-field w-full px-4 py-4 text-base disabled:opacity-50"
          maxLength={300}
        />
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-slate-500 font-mono">VS</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <input
          type="text" value={topic2} onChange={(e) => setTopic2(e.target.value)}
          placeholder="Topic 2 — e.g. BYD EV Strategy"
          disabled={isLoading}
          className="input-field w-full px-4 py-4 text-base disabled:opacity-50"
          maxLength={300}
        />
        <button
          onClick={() => { if (topic1.trim() && topic2.trim() && !isLoading) onSubmit(topic1.trim(), topic2.trim()); }}
          disabled={isLoading || !topic1.trim() || !topic2.trim()}
          className="btn-primary px-6 py-4 flex items-center justify-center gap-2 text-sm mt-2"
        >
          <GitCompare size={16} />
          {isLoading ? "Comparing…" : "Compare Topics"}
        </button>
      </div>
    </div>
  );
}

// ── Side-by-side report ───────────────────────────────────────────────────────
function CompareReports({ report1, report2, topic1, topic2 }: { report1: string; report2: string; topic1: string; topic2: string }) {
  return (
    <div className="w-full animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6 justify-center">
        <span className="text-sm font-semibold text-white px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30">{topic1}</span>
        <span className="text-slate-500 font-mono text-xs">VS</span>
        <span className="text-sm font-semibold text-white px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30">{topic2}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-mono text-blue-400 mb-2 px-1">◀ {topic1}</div>
          <MarkdownReport report={report1} />
        </div>
        <div>
          <div className="text-xs font-mono text-purple-400 mb-2 px-1">▶ {topic2}</div>
          <MarkdownReport report={report2} />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [phase, setPhase] = useState<ResearchPhase>("idle");
  const [agents, setAgents] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [agentsRight, setAgentsRight] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [statusMessage, setStatusMessage] = useState("");
  const [report, setReport] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>("");
  const [reportLeft, setReportLeft] = useState<string | null>(null);
  const [reportRight, setReportRight] = useState<string | null>(null);
  const [topic1, setTopic1] = useState("");
  const [topic2, setTopic2] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<Record<string, number>>({});
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
    setAgents(INITIAL_AGENTS);
    setAgentsRight(INITIAL_AGENTS);
    setStatusMessage("");
    setReport(null);
    setReportLeft(null);
    setReportRight(null);
    setErrorMessage(null);
    setTokenUsage({});
  }, []);

  const updateAgent = useCallback((id: string, status: AgentInfo["status"], slot?: string) => {
    const setter = slot === "right" ? setAgentsRight : setAgents;
    setter((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);

  const addThought = useCallback((agentId: string, thought: string, slot?: string) => {
    const setter = slot === "right" ? setAgentsRight : setAgents;
    setter((prev) => prev.map((a) =>
      a.id === agentId ? { ...a, thoughts: [...(a.thoughts || []).slice(-19), thought] } : a
    ));
  }, []);

  const handleEvent = useCallback((event: ResearchEvent, slot?: string) => {
    switch (event.type) {
      case "status":
        setStatusMessage(event.message);
        break;
      case "agent_start":
        updateAgent(event.id, "active", slot);
        break;
      case "agent_done":
        updateAgent(event.id, "done", slot);
        break;
      case "thought":
        addThought(event.agent_id, event.text, slot);
        break;
      case "complete":
        if (slot === "left") setReportLeft(event.report);
        else if (slot === "right") setReportRight(event.report);
        else {
          setReport(event.report);
          setTokenUsage(event.token_usage ?? {});
          setPhase("complete");
          setAgents((prev) => prev.map((a) => ({ ...a, status: "done" })));
          // Save to history
          if (currentTopic) saveToHistory(currentTopic, event.report);
        }
        break;
      case "error":
        setErrorMessage(event.message);
        setPhase("error");
        setAgents((prev) => prev.map((a) => a.status === "active" ? { ...a, status: "error" } : a));
        break;
    }
  }, [updateAgent, addThought]);

  const streamSSE = useCallback(async (url: string, body: object, signal: AbortSignal) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error ?? `HTTP ${res.status}`);
    }
    if (!res.body) throw new Error("No response body.");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (!data) continue;
          try { yield JSON.parse(data) as ResearchEvent; } catch { /* ignore */ }
        }
      }
    }
  }, []);

  const handleSingleSubmit = useCallback(async (topic: string) => {
    reset();
    setCurrentTopic(topic);
    await new Promise((r) => setTimeout(r, 50));
    setPhase("running");
    setAgents(INITIAL_AGENTS);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      for await (const event of streamSSE("/api/research", { topic }, ctrl.signal)) {
        handleEvent(event);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      setPhase("error");
    }
  }, [reset, streamSSE, handleEvent]);

  const handleCompareSubmit = useCallback(async (t1: string, t2: string) => {
    reset();
    setTopic1(t1);
    setTopic2(t2);
    await new Promise((r) => setTimeout(r, 50));
    setPhase("running");
    setAgents(INITIAL_AGENTS);
    setAgentsRight(INITIAL_AGENTS);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      for await (const event of streamSSE("/api/compare", { topic1: t1, topic2: t2 }, ctrl.signal)) {
        const slot = (event as any).slot;
        handleEvent(event, slot);
      }
      setPhase("complete");
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
      setPhase("error");
    }
  }, [reset, streamSSE, handleEvent]);

  const handleRestoreHistory = useCallback((entry: HistoryEntry) => {
    reset();
    setCurrentTopic(entry.topic);
    setReport(entry.report);
    setPhase("complete");
    setAgents((prev) => prev.map((a) => ({ ...a, status: "done" })));
  }, [reset]);

  const isLoading = phase === "running";
  const isCompareComplete = mode === "compare" && phase === "complete" && reportLeft && reportRight;

  return (
    <main className="relative min-h-screen flex flex-col">
      <BackgroundOrbs />
      <div className="relative z-10 flex-1 flex flex-col px-4 py-12 sm:py-20">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-10">

          {/* Nav */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
              <Zap size={16} className="text-brand-400" />
              <span>ResearchAI</span>
            </div>
            <div className="flex items-center gap-3">
              {/* History */}
              <ResearchHistory onRestore={handleRestoreHistory} />
              {/* Mode toggle */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/[0.07]">
                <button onClick={() => { reset(); setMode("single"); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === "single" ? "bg-brand-500/30 text-brand-300" : "text-slate-500 hover:text-slate-300"}`}>
                  Single
                </button>
                <button onClick={() => { reset(); setMode("compare"); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${mode === "compare" ? "bg-purple-500/30 text-purple-300" : "text-slate-500 hover:text-slate-300"}`}>
                  <GitCompare size={11} /> Compare
                </button>
              </div>
              <a href="https://github.com/Shriyanshu2004/Multi-Agent-Workflow" target="_blank" rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 border border-white/[0.07] rounded-lg px-3 py-1.5 hover:border-white/20">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
            </div>
          </div>

          {phase === "idle" && <StatsRow />}

          {/* Forms */}
          {mode === "single"
            ? <ResearchForm onSubmit={handleSingleSubmit} isLoading={isLoading} />
            : <CompareForm onSubmit={handleCompareSubmit} isLoading={isLoading} />
          }

          {/* Agent panels */}
          {isLoading && (
            <div className={mode === "compare" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}>
              <div>
                {mode === "compare" && <p className="text-xs font-mono text-blue-400 mb-2">{topic1}</p>}
                <AgentStatusPanel agents={agents} statusMessage={statusMessage} />
              </div>
              {mode === "compare" && (
                <div>
                  <p className="text-xs font-mono text-purple-400 mb-2">{topic2}</p>
                  <AgentStatusPanel agents={agentsRight} statusMessage="" />
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {phase === "error" && errorMessage && (
            <div className="w-full max-w-3xl mx-auto glass-card p-5 border-red-500/30 bg-red-500/5 animate-fade-in-up">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-300 mb-1">Research Failed</p>
                  <p className="text-xs text-red-400/80 font-mono break-all">{errorMessage}</p>
                </div>
              </div>
              <button onClick={reset} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/[0.07] transition-all">
                <RefreshCw size={13} /> Try Again
              </button>
            </div>
          )}

          {/* Complete banner */}
          {phase === "complete" && (
            <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
              <div className="flex items-center gap-3 p-4 glass-card border-emerald-500/20 bg-emerald-500/5">
                <div className="flex gap-1.5">{agents.map((a) => <span key={a.id} className="text-base">✅</span>)}</div>
                <p className="text-sm text-emerald-300 font-medium">
                  {mode === "compare" ? "Both topics researched — comparison ready below" : "All 3 agents completed — briefing ready below"}
                </p>
                <button onClick={reset} className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                  <RefreshCw size={12} /> New Research
                </button>
              </div>
            </div>
          )}

          {/* Reports */}
          {phase === "complete" && mode === "single" && report && (
            <MarkdownReport report={report} tokenUsage={tokenUsage} />
          )}
          {isCompareComplete && (
            <CompareReports report1={reportLeft!} report2={reportRight!} topic1={topic1} topic2={topic2} />
          )}

          <footer className="text-center text-xs text-slate-600 mt-8 pb-4">
            Built with CrewAI · Next.js 14 · FastAPI · Groq · Serper
          </footer>
        </div>
      </div>
    </main>
  );
}
