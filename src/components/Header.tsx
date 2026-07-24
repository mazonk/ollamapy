import React from "react";
import { Terminal, Cpu, FileText, Settings, BookOpen, CheckCircle, AlertCircle, RefreshCw, Download } from "lucide-react";
import { LlmProvider } from "../types";

interface HeaderProps {
  activeTab: "summarizer" | "python-studio" | "settings";
  setActiveTab: (tab: "summarizer" | "python-studio" | "settings") => void;
  ollamaOnline: boolean | null;
  ollamaHost: string;
  ollamaModel: string;
  onCheckOllama: () => void;
  checkingOllama: boolean;
  provider: LlmProvider;
  setProvider: (p: LlmProvider) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  ollamaOnline,
  ollamaHost,
  ollamaModel,
  onCheckOllama,
  checkingOllama,
  provider,
  setProvider,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-amber-500 to-orange-600 p-2 rounded-xl text-slate-950 font-bold shadow-lg flex items-center justify-center">
              <Terminal className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight">Ollama Summarizer</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                  Python + Local LLM
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Read documents & summarize locally with Ollama & Python
              </p>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              id="tab-btn-summarizer"
              onClick={() => setActiveTab("summarizer")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "summarizer"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Summarizer Workspace</span>
            </button>

            <button
              id="tab-btn-python-studio"
              onClick={() => setActiveTab("python-studio")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "python-studio"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Python Code Studio</span>
            </button>

            <button
              id="tab-btn-settings"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "settings"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Ollama Settings</span>
            </button>
          </nav>

          {/* Right Status Indicator & Provider Selector */}
          <div className="flex items-center space-x-3">
            {/* Provider Switcher Pill */}
            <div className="hidden lg:flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setProvider("ollama")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center space-x-1 ${
                  provider === "ollama"
                    ? "bg-slate-800 text-amber-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Ollama Local</span>
              </button>
              <button
                onClick={() => setProvider("gemini")}
                className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center space-x-1 ${
                  provider === "gemini"
                    ? "bg-slate-800 text-sky-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>Gemini Cloud</span>
              </button>
            </div>

            {/* Ollama Connection Badge */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                ollamaOnline === true
                  ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
                  : ollamaOnline === false
                  ? "bg-amber-950/30 border-amber-800/40 text-amber-300"
                  : "bg-slate-800/50 border-slate-700/50 text-slate-400"
              }`}
            >
              {checkingOllama ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : ollamaOnline === true ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="font-mono text-[11px] font-medium hidden sm:inline">
                {ollamaOnline === true
                  ? `Ollama: ${ollamaModel}`
                  : ollamaOnline === false
                  ? "Ollama Disconnected"
                  : "Checking Ollama..."}
              </span>
              <button
                onClick={onCheckOllama}
                disabled={checkingOllama}
                title="Check Local Ollama Server Status"
                className="hover:text-white p-0.5 rounded-md hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${checkingOllama ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
