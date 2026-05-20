"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import clsx from "clsx";
import type { AgentInfo } from "@/lib/types";

interface AgentStatusPanelProps {
  agents: AgentInfo[];
  statusMessage: string;
}

const AGENT_ICONS = ["🕵️", "🧠", "✍️"];
const AGENT_COLORS = [
  { active: "from-blue-500/20 to-indigo-500/20", border: "border-blue-500/50", dot: "bg-blue-400", thought: "text-blue-300" },
  { active: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/50", dot: "bg-violet-400", thought: "text-violet-300" },
  { active: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/50", dot: "bg-pink-400", thought: "text-pink-300" },
];

export default function AgentStatusPanel({ agents, statusMessage }: AgentStatusPanelProps) {
  const thoughtRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll thought logs
  useEffect(() => {
    thoughtRefs.current.forEach((ref) => {
      if (ref) ref.scrollTop = ref.scrollHeight;
    });
  }, [agents]);

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
      {/* Terminal header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500/70" />
          <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
          <span className="w-2 h-2 rounded-full bg-green-500/70" />
        </div>
        <p className="text-xs text-slate-500 font-mono">agent-pipeline.log</p>
      </div>

      {/* Agent Cards */}
      <div className="space-y-3">
        {agents.map((agent, idx) => {
          const color = AGENT_COLORS[idx];
          const icon = AGENT_ICONS[idx];
          const isActive = agent.status === "active";
          const isDone = agent.status === "done";
          const isError = agent.status === "error";
          const isPending = agent.status === "pending";
          const hasThoughts = agent.thoughts && agent.thoughts.length > 0;

          return (
            <div key={agent.id} className={clsx("rounded-xl border transition-all duration-500 overflow-hidden",
              isActive && ["bg-gradient-to-r", color.active, color.border, "border"],
              isDone && "border-emerald-500/30 bg-emerald-500/5",
              isError && "border-red-500/30 bg-red-500/5",
              isPending && "opacity-40 border-white/5 bg-white/[0.02]"
            )}>
              {/* Agent header row */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex-shrink-0">
                  {isDone && <CheckCircle2 size={20} className="text-emerald-400" />}
                  {isActive && <div className={clsx("w-3 h-3 rounded-full animate-pulse", color.dot)} />}
                  {isError && <AlertCircle size={20} className="text-red-400" />}
                  {isPending && <Circle size={20} className="text-slate-600" />}
                </div>
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={clsx("text-sm font-semibold truncate",
                      isActive && "text-white", isDone && "text-emerald-300",
                      isError && "text-red-300", isPending && "text-slate-500"
                    )}>
                      {agent.label}
                    </p>
                    {isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-mono animate-pulse">RUNNING</span>}
                    {isDone && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">DONE</span>}
                  </div>
                  <p className={clsx("text-xs mt-0.5 truncate",
                    isActive && "text-slate-300",
                    (isDone || isPending || isError) && "text-slate-600"
                  )}>
                    {agent.description}
                  </p>
                </div>
                <div className={clsx("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border",
                  isActive && "border-white/20 bg-white/10 text-white",
                  isDone && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                  isPending && "border-white/5 bg-white/5 text-slate-600",
                  isError && "border-red-500/30 bg-red-500/10 text-red-400"
                )}>
                  {idx + 1}
                </div>
              </div>

              {/* 🧠 Thought Stream Terminal */}
              {(isActive || isDone) && hasThoughts && (
                <div
                  ref={(el) => { thoughtRefs.current[idx] = el; }}
                  className="mx-4 mb-4 rounded-lg bg-black/40 border border-white/5 p-3 max-h-32 overflow-y-auto font-mono text-xs space-y-1 scrollbar-thin"
                >
                  {agent.thoughts.map((thought, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-slate-600 flex-shrink-0 select-none">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={clsx("leading-relaxed break-words", isActive ? color.thought : "text-slate-500")}>
                        {thought}
                      </span>
                    </div>
                  ))}
                  {isActive && (
                    <div className="flex gap-2 items-center">
                      <span className="text-slate-600 select-none">▶</span>
                      <span className="text-slate-500 animate-pulse">thinking…</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
