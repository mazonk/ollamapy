import React from "react";
import { Sliders, Sparkles, Cpu, Layers, Globe, FileCheck2, CpuIcon } from "lucide-react";
import { SummarizeConfig, SummaryMode, LlmProvider } from "../types";

interface SummaryConfigPanelProps {
  config: SummarizeConfig;
  onChangeConfig: (newConfig: Partial<SummarizeConfig>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  selectedCount: number;
}

const SUMMARY_MODES: { id: SummaryMode; label: string; desc: string }[] = [
  {
    id: "executive",
    label: "Executive Summary",
    desc: "High-level briefing, key findings, strategic impact, and conclusions",
  },
  {
    id: "bullets",
    label: "Bullet Points",
    desc: "Comprehensive topic-by-topic bulleted breakdown",
  },
  {
    id: "key_takeaways",
    label: "Key Takeaways",
    desc: "Top insights, core arguments, and critical data points",
  },
  {
    id: "action_items",
    label: "Action Items",
    desc: "Extracted next steps, decisions, tasks, and responsibilities",
  },
  {
    id: "technical",
    label: "Technical Analysis",
    desc: "In-depth technical breakdown, methodology, specs, and architecture",
  },
  {
    id: "custom",
    label: "Custom Prompt",
    desc: "Specify your own custom prompt instructions for the LLM",
  },
];

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Japanese",
  "Chinese (Simplified)",
  "Portuguese",
  "Italian",
  "Dutch",
];

const OLLAMA_MODELS = [
  { id: "qwen3:8b", label: "Qwen3 (8B)", desc: "Alibaba's advanced open-weight model (Recommended)" },
  { id: "qwen2.5", label: "Qwen 2.5 (7B)", desc: "Alibaba's multilingual LLM" },
  { id: "llama3.1", label: "Llama 3.1 (8B)", desc: "High accuracy general synthesis" },
  { id: "llama3.2", label: "Llama 3.2 (3B)", desc: "Meta's lightweight fast model" },
  { id: "mistral", label: "Mistral 7B", desc: "Fast technical & document parsing" },
  { id: "deepseek-r1", label: "DeepSeek R1", desc: "Advanced reasoning & logic" },
  { id: "gemma2", label: "Gemma 2 (9B)", desc: "Google's open model" },
  { id: "phi3", label: "Phi-3 (3.8B)", desc: "Microsoft's efficient small LLM" },
];

export const SummaryConfigPanel: React.FC<SummaryConfigPanelProps> = ({
  config,
  onChangeConfig,
  onGenerate,
  isGenerating,
  selectedCount,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            Summarization Options
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure local Ollama model, prompt style, and output parameters
          </p>
        </div>

        {/* Provider Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            id="provider-ollama-btn"
            onClick={() => onChangeConfig({ provider: "ollama" })}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
              config.provider === "ollama"
                ? "bg-amber-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Ollama Local</span>
          </button>
          <button
            id="provider-gemini-btn"
            onClick={() => onChangeConfig({ provider: "gemini" })}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
              config.provider === "gemini"
                ? "bg-sky-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Gemini Cloud</span>
          </button>
        </div>
      </div>

      {/* Model Selection */}
      {config.provider === "ollama" && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Ollama Model</span>
            <span className="text-[11px] font-mono text-amber-400">{config.ollamaModel}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {OLLAMA_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onChangeConfig({ ollamaModel: m.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  config.ollamaModel === m.id
                    ? "bg-amber-500/10 border-amber-500 text-slate-100"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div className="text-xs font-bold text-slate-200">{m.label}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Style Grid */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">
          Summary Style / Format
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SUMMARY_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onChangeConfig({ mode: mode.id })}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.mode === mode.id
                  ? "bg-slate-800 border-amber-500 text-slate-100 shadow-xs"
                  : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>{mode.label}</span>
                {config.mode === mode.id && <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt Input */}
      {config.mode === "custom" && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Custom Prompt Instructions
          </label>
          <textarea
            value={config.customPrompt}
            onChange={(e) => onChangeConfig({ customPrompt: e.target.value })}
            placeholder="e.g., Focus on financial statistics, revenue growth, and key risks. Output formatted with emojis."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      )}

      {/* Fine-tuning parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
            <span className="flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              Target Language
            </span>
          </label>
          <select
            value={config.targetLanguage}
            onChange={(e) => onChangeConfig({ targetLanguage: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Chunk Size
            </span>
            <span className="font-mono text-[11px] text-amber-400">{config.chunkSize} words</span>
          </label>
          <input
            type="range"
            min="1000"
            max="6000"
            step="500"
            value={config.chunkSize}
            onChange={(e) => onChangeConfig({ chunkSize: Number(e.target.value) })}
            className="w-full accent-amber-500 bg-slate-950"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
            <span>Temperature</span>
            <span className="font-mono text-[11px] text-amber-400">{config.temperature}</span>
          </label>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.1"
            value={config.temperature}
            onChange={(e) => onChangeConfig({ temperature: Number(e.target.value) })}
            className="w-full accent-amber-500 bg-slate-950"
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        id="btn-generate-summary"
        onClick={onGenerate}
        disabled={isGenerating || selectedCount === 0}
        className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 shadow-md ${
          isGenerating || selectedCount === 0
            ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold hover:shadow-lg scale-[1.005] active:scale-[0.99]"
        }`}
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            <span>Summarizing with {config.provider === "ollama" ? `Ollama (${config.ollamaModel})` : "Gemini 3.6 Flash"}...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>
              Generate Summary ({selectedCount} Document{selectedCount === 1 ? "" : "s"})
            </span>
          </>
        )}
      </button>
    </div>
  );
};
