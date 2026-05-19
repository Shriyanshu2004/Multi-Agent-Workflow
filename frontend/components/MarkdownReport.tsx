"use client";

import { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Copy, Check, Download, FileText, FileDown } from "lucide-react";
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
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Intelligence Briefing</title>
          <style>
            body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
            h1 { font-size: 2em; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { font-size: 1.4em; margin-top: 2em; color: #222; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
            h3 { font-size: 1.1em; color: #333; }
            table { border-collapse: collapse; width: 100%; margin: 1em 0; }
            th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
            pre { background: #f4f4f4; padding: 16px; border-radius: 6px; overflow-x: auto; }
            blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 16px; color: #555; }
            hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
            ul, ol { padding-left: 1.5em; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div id="content"></div>
          <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>
          <script>
            document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(report)});
            setTimeout(() => { window.print(); window.close(); }, 500);
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
            onClick={handleDownloadMd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-slate-400 border border-white/[0.07] hover:bg-white/10 hover:text-white transition-all duration-200"
            title="Download as Markdown"
          >
            <Download size={13} />
            .md
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30 hover:text-white transition-all duration-200"
            title="Download as PDF"
          >
            <FileDown size={13} />
            PDF
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
