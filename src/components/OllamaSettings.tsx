import React, { useState } from "react";
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Layers,
  HelpCircle,
} from "lucide-react";
import { OllamaModelInfo } from "../types";

interface OllamaSettingsProps {
  host: string;
  setHost: (h: string) => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
  onCheckStatus: () => void;
  isChecking: boolean;
  ollamaOnline: boolean | null;
  availableModels: OllamaModelInfo[];
}

export const OllamaSettings: React.FC<OllamaSettingsProps> = ({
  host,
  setHost,
  selectedModel,
  setSelectedModel,
  onCheckStatus,
  isChecking,
  ollamaOnline,
  availableModels,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const COMMANDS = [
    { label: "Start Local Ollama Daemon", cmd: "ollama serve" },
    { label: "Pull Llama 3.2 (3B - Fast)", cmd: "ollama pull llama3.2" },
    { label: "Pull Mistral (7B - Technical)", cmd: "ollama pull mistral" },
    { label: "Pull DeepSeek R1 (Reasoning)", cmd: "ollama pull deepseek-r1" },
    { label: "List Local Installed Models", cmd: "ollama list" },
  ];

  return (
    <div className="space-y-6">
      {/* Connection Config Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-100">
              Ollama Host & Local Model Settings
            </h2>
          </div>

          <button
            onClick={onCheckStatus}
            disabled={isChecking}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
            <span>Test Connection</span>
          </button>
        </div>

        {/* Status Indicator Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            ollamaOnline === true
              ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
              : ollamaOnline === false
              ? "bg-amber-950/30 border-amber-800/60 text-amber-300"
              : "bg-slate-950 border-slate-800 text-slate-400"
          }`}
        >
          <div className="flex items-center space-x-3">
            {ollamaOnline === true ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            )}
            <div>
              <h3 className="text-sm font-bold">
                {ollamaOnline === true
                  ? "Local Ollama Connected & Ready"
                  : ollamaOnline === false
                  ? "Ollama Service Disconnected"
                  : "Checking Ollama Connection..."}
              </h3>
              <p className="text-xs opacity-80 mt-0.5">
                {ollamaOnline === true
                  ? `Found ${availableModels.length} model(s) installed on ${host}`
                  : `Ensure 'ollama serve' is running at ${host}`}
              </p>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Ollama Service Host URL
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Default is <code className="text-amber-400/90 font-mono">http://localhost:11434</code>
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">
              Default Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {availableModels.length > 0 ? (
                availableModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} {m.size ? `(${m.size})` : ""}
                  </option>
                ))
              ) : (
                <>
                  <option value="llama3.2">llama3.2</option>
                  <option value="mistral">mistral</option>
                  <option value="deepseek-r1">deepseek-r1</option>
                  <option value="gemma2">gemma2</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Ollama Terminal Cheatsheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-100">
            Local Ollama Commands & Model Setup
          </h3>
        </div>

        <p className="text-xs text-slate-400">
          Run these commands in your terminal to set up Ollama locally on macOS, Linux, or Windows (WSL / PowerShell):
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {COMMANDS.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between group hover:border-amber-500/40 transition-colors"
            >
              <div>
                <div className="text-[11px] font-medium text-slate-400">{item.label}</div>
                <div className="font-mono text-xs text-amber-400 mt-0.5">{item.cmd}</div>
              </div>

              <button
                onClick={() => copyToClipboard(item.cmd)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                title="Copy Command"
              >
                {copiedCmd === item.cmd ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
