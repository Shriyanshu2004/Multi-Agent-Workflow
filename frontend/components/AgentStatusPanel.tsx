"use client";

import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import clsx from "clsx";
import type { AgentInfo } from "@/lib/types";

interface AgentStatusPanelProps {
  agents: AgentInfo[];
  statusMessage: string;
}

const AGENT_ICONS = ["🕵️", "🧠", "✍️"];
const AGENT_COLORS = [
  { active: "from-blue-500/20 to-indigo-500/20", border: "border-blue-500/50", dot: "bg-blue-400" },
  { active: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/50", dot: "bg-violet-400" },
  { active: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/50", dot: "bg-pink-400" },
];

export default function AgentStatusPanel({
  agents,
  statusMessage,
}: AgentStatusPanelProps) {
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500/70" />
          <span className="w-2 h-2 rounded-full bg-yellow-500/70" />
          <span className="w-2 h-2 rounded-full bg-green-500/70" />
        </div>
        <p className="text-xs text-slate-500 font-mono">
          agent-pipeline.log
        </p>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-brand-950/60 border border-brand-800/40 text-brand-300 text-xs font-mono flex items-center gap-2">
          <Loader2 size={12} className="animate-spin text-brand-400 flex-shrink-0" />
          {statusMessage}
        </div>
      )}

      {/* Agent Cards */}
      <div className="space-y-3">
        {agents.map((agent, idx) => {
          const color = AGENT_COLORS[idx];
          const icon = AGENT_ICONS[idx];
          const isActive = agent.status === "active";
          const isDone = agent.status === "done";
          const isError = agent.status === "error";
          const isPending = agent.status === "pending";

          return (
            <div
              key={agent.id}
              id={`agent-card-${agent.id}`}
              className={clsx(
                "agent-card transition-all duration-500",
                isActive && [
                  "bg-gradient-to-r",
                  color.active,
                  color.border,
                  "border",
                ],
                isDone && "border-emerald-500/30 bg-emerald-500/5",
                isError && "border-red-500/30 bg-red-500/5",
                isPending && "opacity-40"
              )}
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {isDone && (
                  <CheckCircle2 size={20} className="text-emerald-400" />
                )}
                {isActive && (
                  <div className={clsx("pulse-orb", color.dot)} />
                )}
                {isError && (
                  <AlertCircle size={20} className="text-red-400" />
                )}
                {isPending && (
                  <Circle size={20} className="text-slate-600" />
                )}
              </div>

              {/* Agent emoji icon */}
              <span className="text-xl flex-shrink-0">{icon}</span>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={clsx(
                      "text-sm font-semibold truncate",
                      isActive && "text-white",
                      isDone && "text-emerald-300",
                      isError && "text-red-300",
                      isPending && "text-slate-500"
                    )}
                  >
                    {agent.label}
                  </p>
                  {isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-mono animate-pulse">
                      RUNNING
                    </span>
                  )}
                  {isDone && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                      DONE
                    </span>
                  )}
                </div>
                <p
                  className={clsx(
                    "text-xs mt-0.5 truncate",
                    isActive && "text-slate-300",
                    (isDone || isPending || isError) && "text-slate-600"
                  )}
                >
                  {agent.description}
                </p>
              </div>

              {/* Step number badge */}
              <div
                className={clsx(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border",
                  isActive && "border-white/20 bg-white/10 text-white",
                  isDone && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                  isPending && "border-white/5 bg-white/5 text-slate-600",
                  isError && "border-red-500/30 bg-red-500/10 text-red-400"
                )}
              >
                {idx + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline connector lines */}
      <div className="flex justify-start pl-[22px] mt-1 mb-1">
        <div className="flex flex-col gap-0">
          {agents.slice(0, -1).map((_, i) => (
            <div
              key={i}
              className="w-px h-3 bg-gradient-to-b from-white/10 to-transparent"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
