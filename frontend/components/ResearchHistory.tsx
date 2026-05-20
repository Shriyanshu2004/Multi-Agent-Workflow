"use client";

import { useState, useEffect, useCallback } from "react";
import { History, X, ChevronRight, Clock, Trash2 } from "lucide-react";
import clsx from "clsx";

export interface HistoryEntry {
  id: string;
  topic: string;
  report: string;
  timestamp: number;
  wordCount: number;
}

const STORAGE_KEY = "research_history";
const MAX_ENTRIES = 5;

export function saveToHistory(topic: string, report: string) {
  try {
    const existing: HistoryEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      topic,
      report,
      timestamp: Date.now(),
      wordCount: report.split(/\s+/).filter(Boolean).length,
    };
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface ResearchHistoryProps {
  onRestore: (entry: HistoryEntry) => void;
}

export default function ResearchHistory({ onRestore }: ResearchHistoryProps) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, [open]);

  const deleteEntry = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, [history]);

  const clearAll = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  if (history.length === 0 && !open) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
          open
            ? "bg-brand-500/20 text-brand-300 border-brand-500/30"
            : "bg-white/5 text-slate-400 border-white/[0.07] hover:text-slate-300 hover:border-white/20"
        )}
      >
        <History size={13} />
        History
        {history.length > 0 && (
          <span className="w-4 h-4 rounded-full bg-brand-500/40 text-brand-300 text-[10px] flex items-center justify-center font-bold">
            {history.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 glass-card border border-white/10 shadow-2xl z-50 overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
            <p className="text-xs font-semibold text-white flex items-center gap-2">
              <History size={12} className="text-brand-400" />
              Recent Briefings
            </p>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button onClick={clearAll} className="text-[10px] text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1">
                  <Trash2 size={10} /> Clear
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-600">No history yet</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => { onRestore(entry); setOpen(false); }}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors group flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-300 truncate group-hover:text-white transition-colors">
                      {entry.topic}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-[10px] text-slate-600">
                        <Clock size={9} /> {timeAgo(entry.timestamp)}
                      </span>
                      <span className="text-[10px] text-slate-600">·</span>
                      <span className="text-[10px] text-slate-600">{entry.wordCount} words</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => deleteEntry(entry.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all p-1"
                    >
                      <X size={11} />
                    </button>
                    <ChevronRight size={13} className="text-slate-600 group-hover:text-brand-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
