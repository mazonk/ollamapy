import React, { useState } from "react";
import Markdown from "react-markdown";
import {
  FileText,
  Copy,
  Check,
  Download,
  Sparkles,
  Zap,
  Clock,
  Layers,
  Tag,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { SummaryResult } from "../types";

interface SummaryViewerProps {
  results: SummaryResult[];
  onClearResults: () => void;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({
  results,
  onClearResults,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeResultIdx, setActiveResultIdx] = useState<number>(0);

  if (results.length === 0) return null;

  const currentResult = results[activeResultIdx] || results[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (result: SummaryResult, format: "md" | "txt") => {
    const filename = `${result.documentName.replace(/\.[^/.]+$/, "")}_summary.${format}`;
    const content = `# Summary: ${result.documentName}\n\nModel: ${result.modelUsed} (${result.providerUsed})\n\n${result.summary}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const reductionPercent = currentResult.wordCountOriginal
    ? Math.round((1 - currentResult.wordCountSummary / currentResult.wordCountOriginal) * 100)
    : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
      {/* Top Header & Tabs if multiple documents */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-slate-100">
              Generated Summaries ({results.length})
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Summary produced using {currentResult.modelUsed} ({currentResult.providerUsed.toUpperCase()})
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleCopy(currentResult.summary, currentResult.id)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
          >
            {copiedId === currentResult.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleDownload(currentResult, "md")}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>

          <button
            onClick={onClearResults}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Multi Document Tabs if > 1 result */}
      {results.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800">
          {results.map((res, idx) => (
            <button
              key={res.id}
              onClick={() => setActiveResultIdx(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center space-x-2 ${
                activeResultIdx === idx
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{res.documentName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Metric Highlights Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Reduction Ratio
          </div>
          <div className="text-base font-bold text-emerald-400 mt-1 font-mono">
            {reductionPercent > 0 ? `-${reductionPercent}%` : "Concise"}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <FileText className="w-3 h-3 text-sky-400" /> Word Counts
          </div>
          <div className="text-xs font-mono text-slate-200 mt-1">
            {currentResult.wordCountSummary} <span className="text-slate-500">/ {currentResult.wordCountOriginal}</span>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-400" /> Chunks Processed
          </div>
          <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
            {currentResult.chunkCount} section{currentResult.chunkCount === 1 ? "" : "s"}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Executed Model
          </div>
          <div className="text-xs font-bold text-amber-400 mt-1 truncate font-mono">
            {currentResult.modelUsed}
          </div>
        </div>
      </div>

      {/* Key Bullets Highlights if available */}
      {currentResult.keyPoints && currentResult.keyPoints.length > 0 && (
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            Core Highlights
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
            {currentResult.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Markdown Content Box */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-6 shadow-inner text-slate-200 leading-relaxed overflow-x-auto">
        <div className="markdown-body prose prose-invert max-w-none text-sm text-slate-200 space-y-3">
          <Markdown>{currentResult.summary}</Markdown>
        </div>
      </div>

      {/* Entity Tags */}
      {currentResult.entities && currentResult.entities.length > 0 && (
        <div className="flex items-center space-x-2 flex-wrap pt-2">
          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-500" /> Topics Extracted:
          </span>
          {currentResult.entities.map((ent, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2.5 py-1 bg-slate-800/80 text-amber-300/90 rounded-md border border-slate-700/60"
            >
              #{ent}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
