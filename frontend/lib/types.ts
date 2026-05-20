/** types.ts — Shared TypeScript type definitions */

// ─── SSE Event types ──────────────────────────────────────────────────────────

export type AgentId = "scraper" | "synthesizer" | "writer";
export type AgentStatus = "pending" | "active" | "done" | "error";

export interface StatusEvent {
  type: "status";
  message: string;
}

export interface AgentStartEvent {
  type: "agent_start";
  id: AgentId;
  label: string;
  description: string;
}

export interface AgentDoneEvent {
  type: "agent_done";
  id: AgentId;
  label: string;
  description: string;
}

export interface ThoughtEvent {
  type: "thought";
  agent_id: AgentId;
  text: string;
}

export interface CompleteEvent {
  type: "complete";
  report: string;
  token_usage: Record<string, number>;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export interface StreamEndEvent {
  type: "stream_end";
}

export type ResearchEvent =
  | StatusEvent
  | AgentStartEvent
  | AgentDoneEvent
  | ThoughtEvent
  | CompleteEvent
  | ErrorEvent
  | StreamEndEvent;

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface AgentInfo {
  id: AgentId;
  label: string;
  description: string;
  status: AgentStatus;
  thoughts: string[];
}

export type ResearchPhase = "idle" | "running" | "complete" | "error";

export interface ResearchState {
  phase: ResearchPhase;
  agents: AgentInfo[];
  statusMessage: string;
  report: string | null;
  errorMessage: string | null;
  tokenUsage: Record<string, number>;
}
