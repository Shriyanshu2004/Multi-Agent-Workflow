"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Copy, Check, Download, FileText } from "lucide-react";
import clsx from "clsx";

interface MarkdownReportProps {
  report: string;
  tokenUsage?: Record<string, number>;
}

export default function MarkdownReport({ report, tokenUsage }: MarkdownReportProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [report]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intelligence-briefing-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  const wordCount = report.split(/\s+/).filter(Boolean).length;

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up">
      {/* ── Toolbar ── */}
      <div className="glass-card p-4 mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Corporate Intelligence Briefing</p>
            <p className="text-xs text-slate-500">
              {wordCount.toLocaleString()} words
              {tokenUsage && Object.keys(tokenUsage).length > 0 && (
                <> · {(tokenUsage.total_tokens || 0).toLocaleString()} tokens used</>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="copy-report-btn"
            onClick={handleCopy}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
              copied
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-white/5 text-slate-400 border border-white/[0.07] hover:bg-white/10 hover:text-white"
            )}
            title="Copy to clipboard"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy MD"}
          </button>

          <button
            id="download-report-btn"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-slate-400 border border-white/[0.07] hover:bg-white/10 hover:text-white transition-all duration-200"
            title="Download as Markdown"
          >
            <Download size={13} />
            Download
          </button>
        </div>
      </div>

      {/* ── Report Body ── */}
      <div className="glass-card p-6 sm:p-8">
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              // Custom link renderer — opens in new tab
              a: ({ href, children, ...props }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-300 underline underline-offset-2 transition-colors"
                  {...props}
                >
                  {children}
                </a>
              ),
              // Wrap tables in overflow container
              table: ({ children, ...props }) => (
                <div className="overflow-x-auto rounded-lg">
                  <table {...props}>{children}</table>
                </div>
              ),
            }}
          >
            {report}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
