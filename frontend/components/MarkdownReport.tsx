"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Copy, Check, Download, FileText, FileDown, Clock, BarChart3 } from "lucide-react";
import clsx from "clsx";

interface MarkdownReportProps {
  report: string;
  tokenUsage?: Record<string, number>;
  animate?: boolean;
}

// ── Confidence Score Extractor ────────────────────────────────────────────────
function extractConfidenceScore(report: string): number {
  const text = report.toLowerCase();
  let high = 0, medium = 0, low = 0;
  const highMatches = text.match(/\bhigh\b/g);
  const medMatches = text.match(/\bmedium\b/g);
  const lowMatches = text.match(/\blow\b/g);
  high = highMatches?.length ?? 0;
  medium = medMatches?.length ?? 0;
  low = lowMatches?.length ?? 0;
  const total = high + medium + low;
  if (total === 0) return 72; // default
  return Math.round(((high * 100 + medium * 60 + low * 30) / total));
}

// ── Confidence Gauge ──────────────────────────────────────────────────────────
function ConfidenceGauge({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayed / 100) * circumference;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "High" : score >= 45 ? "Medium" : "Low";

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(ease * score));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/[0.07]">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={radius} fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.05s linear", filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{displayed}%</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-white">Confidence</p>
        <p className="text-xs" style={{ color }}>{label} reliability</p>
        <p className="text-[10px] text-slate-600 mt-0.5">Based on source analysis</p>
      </div>
    </div>
  );
}

// ── Typing Effect Hook ────────────────────────────────────────────────────────
function useTypingEffect(text: string, enabled: boolean, speed = 8) {
  const [displayed, setDisplayed] = useState(enabled ? "" : text);
  const [done, setDone] = useState(!enabled);
  const indexRef = useRef(0);

  useEffect(() => {
    if (!enabled) { setDisplayed(text); setDone(true); return; }
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      indexRef.current += speed;
      if (indexRef.current >= text.length) {
        setDisplayed(text);
        setDone(true);
        clearInterval(interval);
      } else {
        setDisplayed(text.slice(0, indexRef.current));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [text, enabled, speed]);

  return { displayed, done };
}

export default function MarkdownReport({ report, tokenUsage, animate = true }: MarkdownReportProps) {
  const [copied, setCopied] = useState(false);
  const confidence = extractConfidenceScore(report);
  const wordCount = report.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));
  const { displayed, done } = useTypingEffect(report, animate, 12);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  }, [report]);

  const handleDownloadMd = useCallback(() => {
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intelligence-briefing-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  const handleDownloadPdf = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Intelligence Briefing</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.6}h1{font-size:2em;border-bottom:2px solid #333;padding-bottom:10px}h2{font-size:1.4em;margin-top:2em;color:#222;border-bottom:1px solid #ccc;padding-bottom:6px}table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid #ccc;padding:8px 12px;text-align:left}th{background:#f5f5f5;font-weight:bold}code{background:#f4f4f4;padding:2px 6px;border-radius:3px;font-size:.9em}pre{background:#f4f4f4;padding:16px;border-radius:6px;overflow-x:auto}hr{border:none;border-top:1px solid #ddd;margin:2em 0}ul,ol{padding-left:1.5em}@media print{body{margin:20px}}</style></head><body><div id="content"></div><script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script><script>document.getElementById('content').innerHTML=marked.parse(${JSON.stringify(report)});setTimeout(()=>{window.print();window.close()},500)<\/script></body></html>`);
    printWindow.document.close();
  }, [report]);

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up">
      {/* ── Toolbar ── */}
      <div className="glass-card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Left: icon + meta */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Corporate Intelligence Briefing</p>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-slate-500">{wordCount.toLocaleString()} words</span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={10} /> {readingTime} min read
                </span>
                {tokenUsage && Object.keys(tokenUsage).length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <BarChart3 size={10} /> {(tokenUsage.total_tokens || 0).toLocaleString()} tokens
                  </span>
                )}
                {!done && (
                  <span className="text-xs text-brand-400 font-mono animate-pulse">● writing…</span>
                )}
              </div>
            </div>
          </div>

          {/* Confidence gauge */}
          {done && <ConfidenceGauge score={confidence} />}

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button onClick={handleCopy}
              className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                copied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                       : "bg-white/5 text-slate-400 border border-white/[0.07] hover:bg-white/10 hover:text-white"
              )}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button onClick={handleDownloadMd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-slate-400 border border-white/[0.07] hover:bg-white/10 hover:text-white transition-all duration-200">
              <Download size={13} /> .md
            </button>
            <button onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30 hover:text-white transition-all duration-200">
              <FileDown size={13} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Report Body ── */}
      <div className="glass-card p-6 sm:p-8">
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              a: ({ href, children, ...props }) => (
                <a href={href} target="_blank" rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors" {...props}>
                  {children}
                </a>
              ),
              table: ({ children, ...props }) => (
                <div className="overflow-x-auto rounded-lg"><table {...props}>{children}</table></div>
              ),
            }}
          >
            {displayed}
          </ReactMarkdown>
          {/* Blinking cursor while typing */}
          {!done && (
            <span className="inline-block w-0.5 h-4 bg-brand-400 ml-0.5 animate-pulse align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}
