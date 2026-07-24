import React, { useState, useEffect } from "react";
import {
  Terminal,
  FileCode,
  Copy,
  Check,
  Download,
  Play,
  Settings,
  FolderArchive,
  BookOpen,
  Sparkles,
  ExternalLink,
  Code2,
} from "lucide-react";
import { PythonProject, GeneratedFile } from "../types";

interface PythonStudioProps {
  defaultModel: string;
  defaultHost: string;
}

export const PythonStudio: React.FC<PythonStudioProps> = ({
  defaultModel,
  defaultHost,
}) => {
  const [model, setModel] = useState(defaultModel || "llama3.2");
  const [host, setHost] = useState(defaultHost || "http://localhost:11434");
  const [project, setProject] = useState<PythonProject | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("app.py");
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedFileName, setCopiedFileName] = useState<string | null>(null);
  const [copiedCommandIdx, setCopiedCommandIdx] = useState<number | null>(null);

  const fetchPythonCode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/python/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          host,
          chunkSize: 2000,
          overlap: 200,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (err) {
      console.error("Failed to generate Python codebase:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPythonCode();
  }, [model, host]);

  const selectedFile: GeneratedFile | undefined = project?.files.find(
    (f) => f.name === selectedFileName
  ) || project?.files[0];

  const handleCopyCode = (content: string, fileName: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFileName(fileName);
    setTimeout(() => setCopiedFileName(null), 2000);
  };

  const handleDownloadFile = (file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    if (!project) return;
    project.files.forEach((file) => handleDownloadFile(file));
  };

  const copyCommand = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommandIdx(idx);
    setTimeout(() => setCopiedCommandIdx(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl shadow-md">
                <Terminal className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  Python Ollama App Generator & Code Studio
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete, multi-file Python codebase for local document summarization with Ollama
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download All Python Files</span>
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">
              Ollama Model for Generated Code
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="llama3.2">Llama 3.2 (3B) - Fast Default</option>
              <option value="llama3.1">Llama 3.1 (8B) - High Quality</option>
              <option value="mistral">Mistral (7B) - Technical & Markdown</option>
              <option value="deepseek-r1">DeepSeek R1 - Advanced Reasoning</option>
              <option value="gemma2">Gemma 2 (9B)</option>
              <option value="phi3">Phi-3 (3.8B)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">
              Target Ollama Host
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Code Editor & File Explorer Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Tree Sidebar */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center justify-between">
            <span>Project Structure</span>
            <Code2 className="w-3.5 h-3.5 text-amber-500" />
          </h3>

          <div className="space-y-1">
            {project?.files.map((file) => {
              const isActive = file.name === selectedFileName;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFileName(file.name)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group ${
                    isActive
                      ? "bg-amber-500/15 border border-amber-500/50 text-slate-100"
                      : "hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <FileCode
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-amber-400" : "text-slate-500 group-hover:text-amber-400"
                      }`}
                    />
                    <span className="text-xs font-mono font-medium truncate">
                      {file.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Setup Instructions Quick Box */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Quick Setup Steps
            </h4>
            <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
              {project?.setupCommands.map((cmd, i) => (
                <div
                  key={i}
                  onClick={() => copyCommand(cmd, i)}
                  className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 hover:border-amber-500/50 cursor-pointer flex items-center justify-between group"
                >
                  <span className="truncate">{cmd}</span>
                  {copiedCommandIdx === i ? (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-600 group-hover:text-amber-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code View Pane */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-sm overflow-hidden">
          {/* File Action Bar */}
          {selectedFile && (
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-sm font-bold text-slate-100">
                    {selectedFile.name}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedFile.description}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopyCode(selectedFile.content, selectedFile.name)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                >
                  {copiedFileName === selectedFile.name ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownloadFile(selectedFile)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}

          {/* Code Body */}
          <div className="p-5 overflow-x-auto bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed min-h-[480px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-2">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p>Generating Python Ollama code...</p>
              </div>
            ) : selectedFile ? (
              <pre className="whitespace-pre">
                <code>{selectedFile.content}</code>
              </pre>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
