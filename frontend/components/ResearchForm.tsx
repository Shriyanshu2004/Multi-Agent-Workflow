"use client";

import { useState, useRef, type FormEvent } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import clsx from "clsx";

interface ResearchFormProps {
  onSubmit: (topic: string) => void;
  isLoading: boolean;
}

const EXAMPLE_TOPICS = [
  "AI in Healthcare 2025",
  "EV Battery Technology Trends",
  "Generative AI in Finance",
  "Quantum Computing Market",
  "Space Economy & Commercial Launch",
];

export default function ResearchForm({ onSubmit, isLoading }: ResearchFormProps) {
  const [topic, setTopic] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  }

  function handleExample(t: string) {
    setTopic(t);
    inputRef.current?.focus();
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* ── Headline ── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-700/50 bg-brand-950/50 text-brand-300 text-xs font-medium mb-6 backdrop-blur-sm">
          <Sparkles size={12} className="text-brand-400" />
          Powered by CrewAI × OpenAI × Serper
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-white via-brand-200 to-brand-400 bg-clip-text text-transparent">
            Multi-Agent
          </span>
          <br />
          <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Research Intelligence
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
          Three specialized AI agents collaborate in real-time to deliver a
          boardroom-ready corporate intelligence briefing on any topic.
        </p>
      </div>

      {/* ── Search Form ── */}
      <form onSubmit={handleSubmit} className="relative group">
        <div
          className={clsx(
            "absolute -inset-0.5 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm",
            "bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500"
          )}
        />
        <div className="relative flex gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              ref={inputRef}
              id="research-topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. AI in Healthcare 2025, EV Battery Technology…"
              disabled={isLoading}
              className="input-field w-full pl-11 pr-4 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={300}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            id="start-research-btn"
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="btn-primary px-6 py-4 flex items-center gap-2 text-sm whitespace-nowrap relative z-10"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Researching…</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Generate Briefing</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Example Chips ── */}
      {!isLoading && (
        <div className="mt-5 flex flex-wrap gap-2 justify-center animate-fade-in-up">
          <span className="text-slate-600 text-xs self-center">Try:</span>
          {EXAMPLE_TOPICS.map((t) => (
            <button
              key={t}
              id={`example-${t.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => handleExample(t)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-white/[0.07] hover:border-brand-500/40 hover:text-brand-300 hover:bg-brand-950/40 transition-all duration-200 backdrop-blur-sm"
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
