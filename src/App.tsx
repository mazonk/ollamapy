import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import {
  UploadCloud,
  FileText,
  Sparkles,
  Send,
  Copy,
  Check,
  Download,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  ShieldAlert,
  Sliders,
  ChevronDown,
  ChevronUp,
  Table,
  CheckCircle,
  XCircle,
  Activity,
  Network,
  ArrowRight,
  Layers,
  Settings,
  Cpu,
  RefreshCw,
  Terminal,
  ExternalLink,
  X,
} from "lucide-react";
import { parseUploadedFile } from "./utils/documentParser";
import { SAMPLE_DOCUMENTS } from "./data/sampleDocs";
import { DEFAULT_RISK_RULES } from "./data/defaultRiskRules";
import { analyzeDocumentRisk } from "./utils/riskEvaluator";
import { RiskProfileManager } from "./components/RiskProfileManager";
import { EntityGraphPage } from "./components/EntityGraphPage";
import {
  extractDocumentEntitiesAndLinks,
  buildFactualSemanticExtraction,
} from "./utils/entityExtractor";
import {
  DocumentFile,
  RiskRule,
  DocumentRiskAnalysisResult,
  DocumentEntitiesExportJSON,
  OllamaModelInfo,
} from "./types";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"workspace" | "entity-graph">("workspace");
  const [documents, setDocuments] = useState<DocumentFile[]>(SAMPLE_DOCUMENTS);
  const [activeDocId, setActiveDocId] = useState<string>(SAMPLE_DOCUMENTS[0].id);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Question & Summary state
  const [question, setQuestion] = useState<string>("");
  const [outputTitle, setOutputTitle] = useState<string>("");
  const [outputContent, setOutputContent] = useState<string>("");
  const [outputEngine, setOutputEngine] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Risk Rules & Analysis state
  const [riskRules, setRiskRules] = useState<RiskRule[]>(DEFAULT_RISK_RULES);
  const [riskAnalysisResult, setRiskAnalysisResult] = useState<DocumentRiskAnalysisResult | null>(null);
  const [showRiskManager, setShowRiskManager] = useState<boolean>(false);

  // Extracted Entities & Links JSON data per document
  const [extractedData, setExtractedData] = useState<Record<string, DocumentEntitiesExportJSON>>({});
  const [isExtractingGraph, setIsExtractingGraph] = useState<boolean>(false);

  // Ollama configuration & status
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [ollamaHost, setOllamaHost] = useState<string>("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState<string>("llama3.2");
  const [availableModels, setAvailableModels] = useState<OllamaModelInfo[]>([]);
  const [isCheckingOllama, setIsCheckingOllama] = useState<boolean>(false);
  const [showOllamaModal, setShowOllamaModal] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active document object
  const currentDoc = documents.find((d) => d.id === activeDocId) || documents[0];
  const currentExportData = currentDoc ? extractedData[currentDoc.id] : null;

  // Initialize pre-seeded extraction data for initial sample documents on mount
  useEffect(() => {
    const initialData: Record<string, DocumentEntitiesExportJSON> = {};
    SAMPLE_DOCUMENTS.forEach((doc) => {
      initialData[doc.id] = buildFactualSemanticExtraction(doc);
    });
    setExtractedData(initialData);
  }, []);

  // Check Ollama status (tries direct client browser fetch, then backend proxy)
  const checkOllama = async (customHost?: string) => {
    const targetHost = customHost || ollamaHost;
    setIsCheckingOllama(true);

    try {
      // 1. Try direct browser fetch to Ollama
      const cleanUrl = targetHost.replace(/\/$/, "");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      try {
        const directRes = await fetch(`${cleanUrl}/api/tags`, {
          method: "GET",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (directRes.ok) {
          const data = await directRes.json();
          setOllamaOnline(true);
          setAvailableModels(data.models || []);
          setIsCheckingOllama(false);
          return true;
        }
      } catch {
        // Direct browser fetch failed (e.g. CORS or different network), try server proxy
      }

      // 2. Try backend proxy
      const res = await fetch("/api/ollama/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: targetHost }),
      });

      if (res.ok) {
        const data = await res.json();
        setOllamaOnline(Boolean(data.online));
        if (data.models && Array.isArray(data.models)) {
          setAvailableModels(data.models);
        }
        setIsCheckingOllama(false);
        return Boolean(data.online);
      } else {
        setOllamaOnline(false);
        setIsCheckingOllama(false);
        return false;
      }
    } catch {
      setOllamaOnline(false);
      setIsCheckingOllama(false);
      return false;
    }
  };

  useEffect(() => {
    checkOllama();
  }, []);

  // Background trigger for Entity & Relationship Extraction
  const triggerEntityExtraction = async (doc: DocumentFile) => {
    setIsExtractingGraph(true);
    try {
      const data = await extractDocumentEntitiesAndLinks(doc, ollamaHost, ollamaModel);
      setExtractedData((prev) => ({
        ...prev,
        [doc.id]: data,
      }));
    } catch (err) {
      console.error("Entity extraction failed, building fallback data:", err);
      const fallback = buildFactualSemanticExtraction(doc);
      setExtractedData((prev) => ({
        ...prev,
        [doc.id]: fallback,
      }));
    } finally {
      setIsExtractingGraph(false);
    }
  };

  // Handle uploaded files: parse and auto-trigger entity recognition
  const handleFileUpload = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    setIsParsing(true);

    const parsedResults: DocumentFile[] = [];
    for (let i = 0; i < filesList.length; i++) {
      try {
        const parsed = await parseUploadedFile(filesList[i]);
        parsedResults.push(parsed);
      } catch (err) {
        console.error("Parse failed for file:", filesList[i].name, err);
      }
    }

    if (parsedResults.length > 0) {
      setDocuments((prev) => [...parsedResults, ...prev]);
      const newestDoc = parsedResults[0];
      setActiveDocId(newestDoc.id);
      setIsParsing(false);

      // Auto-trigger AI Entity & Relationship recognition on upload
      await triggerEntityExtraction(newestDoc);
    } else {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleFileUpload(e.dataTransfer.files);
    }
  };

  // 1. Handle Summarize Click
  const handleSummarize = async () => {
    if (!currentDoc || isLoading) return;
    setIsLoading(true);
    setRiskAnalysisResult(null);
    setOutputTitle(`Summary: ${currentDoc.name}`);
    setOutputContent("");
    setOutputEngine("");

    const promptText = `Please provide a clear, comprehensive, and well-structured summary of the following document titled "${currentDoc.name}". Use markdown formatting with bullet points and key takeaways.\n\nDocument Content:\n${currentDoc.text.slice(0, 16000)}`;

    let generatedText = "";
    let engineUsed = "";

    // 1. Try local Ollama direct
    try {
      const cleanUrl = ollamaHost.replace(/\/$/, "");
      const directRes = await fetch(`${cleanUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: promptText,
          stream: false,
        }),
      });

      if (directRes.ok) {
        const data = await directRes.json();
        if (data.response) {
          generatedText = data.response;
          engineUsed = `Ollama (${ollamaModel})`;
        }
      }
    } catch {
      // direct browser call failed, try backend proxy
    }

    if (!generatedText) {
      try {
        const proxyRes = await fetch("/api/ollama/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host: ollamaHost,
            model: ollamaModel,
            prompt: promptText,
          }),
        });

        if (proxyRes.ok) {
          const data = await proxyRes.json();
          if (data.response) {
            generatedText = data.response;
            engineUsed = `Ollama (${ollamaModel})`;
          }
        }
      } catch {
        // ollama proxy failed
      }
    }

    // 2. Fallback to Gemini if Ollama not responding
    if (!generatedText) {
      try {
        const res = await fetch("/api/gemini/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: currentDoc.text,
            documentName: currentDoc.name,
            mode: "executive",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          generatedText = data.summary || "Summary generated successfully.";
          engineUsed = "Gemini AI";
        }
      } catch (err: any) {
        console.error("Gemini summarize error:", err);
      }
    }

    if (!generatedText) {
      generatedText = `### Document Summary: ${currentDoc.name}\n\n- **Document Size**: ${roundSize(currentDoc.size)} (${currentDoc.wordCount} words)\n- **Overview**: This document contains ${currentDoc.text.split("\n\n").length} paragraphs of structured text.\n- **Status**: Processed locally via document parsing engine.`;
      engineUsed = "Local Semantic Engine";
    }

    setOutputContent(generatedText);
    setOutputEngine(engineUsed);
    setIsLoading(false);
  };

  // 2. Handle Risk Profile Formula Analysis
  const handleAnalyzeRisk = async () => {
    if (!currentDoc || isLoading) return;
    setIsLoading(true);
    setRiskAnalysisResult(null);
    setOutputTitle(`Risk Profile Evaluation: ${currentDoc.name}`);
    setOutputContent("");
    setOutputEngine(ollamaOnline ? `Ollama (${ollamaModel})` : "Formula Engine");

    try {
      const result = await analyzeDocumentRisk(
        currentDoc,
        riskRules,
        ollamaHost,
        ollamaModel
      );
      setRiskAnalysisResult(result);
      setOutputContent(result.aiRiskSummary);
    } catch (err: any) {
      setOutputContent(`Error evaluating risk profile: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Ask Question
  const handleAskQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || !currentDoc || isLoading) return;

    const userQ = question.trim();
    setIsLoading(true);
    setRiskAnalysisResult(null);
    setOutputTitle(`Q: ${userQ}`);
    setOutputContent("");
    setOutputEngine("");

    const promptText = `Document Title: "${currentDoc.name}"\nDocument Text:\n${currentDoc.text.slice(0, 16000)}\n\nQuestion: ${userQ}\n\nPlease answer the question concisely and accurately based ONLY on the document provided above. Use Markdown if formatting helps readability.`;

    let answerText = "";
    let engineUsed = "";

    // 1. Try local Ollama direct
    try {
      const cleanUrl = ollamaHost.replace(/\/$/, "");
      const directRes = await fetch(`${cleanUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: promptText,
          stream: false,
        }),
      });

      if (directRes.ok) {
        const data = await directRes.json();
        if (data.response) {
          answerText = data.response;
          engineUsed = `Ollama (${ollamaModel})`;
        }
      }
    } catch {
      // proxy fallback
    }

    if (!answerText) {
      try {
        const proxyRes = await fetch("/api/ollama/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            host: ollamaHost,
            model: ollamaModel,
            prompt: promptText,
          }),
        });

        if (proxyRes.ok) {
          const data = await proxyRes.json();
          if (data.response) {
            answerText = data.response;
            engineUsed = `Ollama (${ollamaModel})`;
          }
        }
      } catch {
        // fallback
      }
    }

    // 2. Try Gemini
    if (!answerText) {
      try {
        const res = await fetch("/api/gemini/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: currentDoc.text,
            documentName: currentDoc.name,
            mode: "custom",
            customPrompt: `Answer this specific question based on the document: ${userQ}`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          answerText = data.summary || "Answer generated.";
          engineUsed = "Gemini AI";
        }
      } catch (err: any) {
        answerText = `Error answering question: ${err.message || err}`;
        engineUsed = "Error";
      }
    }

    setOutputContent(answerText);
    setOutputEngine(engineUsed);
    setIsLoading(false);
    setQuestion("");
  };

  const handleCopy = () => {
    if (!outputContent) return;
    navigator.clipboard.writeText(outputContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputContent) return;
    const blob = new Blob([outputContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document_output.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                <span>DocuAI</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono">
                  Ollama + KG
                </span>
              </h1>
            </div>
          </div>

          {/* Primary View Switcher Tabs */}
          <nav className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setCurrentPage("workspace")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentPage === "workspace"
                  ? "bg-amber-500 text-slate-950 shadow-sm font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Workspace & Risk</span>
            </button>

            <button
              onClick={() => {
                setCurrentPage("entity-graph");
                if (currentDoc && !extractedData[currentDoc.id]) {
                  triggerEntityExtraction(currentDoc);
                }
              }}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentPage === "entity-graph"
                  ? "bg-cyan-500 text-slate-950 shadow-sm font-bold"
                  : "text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Entities & Links (JSON Export)</span>
              {currentExportData && (
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-cyan-300 font-mono">
                  {currentExportData.entities.length}
                </span>
              )}
            </button>
          </nav>

          {/* Right Controls & Ollama Connection Button */}
          <div className="flex items-center space-x-2 text-xs">
            {currentPage === "workspace" && (
              <button
                onClick={() => setShowRiskManager(!showRiskManager)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  showRiskManager
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-900 border-slate-800 text-amber-400 hover:border-amber-500/50"
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span className="hidden md:inline">{showRiskManager ? "Hide Risk Rules" : "CRUD Risk Rules"}</span>
              </button>
            )}

            {/* Clickable Ollama Status & Setup Trigger */}
            <button
              onClick={() => setShowOllamaModal(true)}
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-mono border transition-all hover:scale-105 active:scale-95 ${
                ollamaOnline
                  ? "bg-emerald-950/60 border-emerald-700/80 text-emerald-400 hover:bg-emerald-900/60"
                  : "bg-slate-900 border-slate-750 text-slate-400 hover:border-amber-500/50 hover:text-slate-200"
              }`}
              title="Click to Configure or Start Local Ollama"
            >
              {ollamaOnline ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <Cpu className="w-3 h-3 text-amber-400" />
              )}
              <span>{ollamaOnline ? `Ollama: ${ollamaModel}` : "Ollama Setup"}</span>
              <Settings className="w-3 h-3 opacity-60 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* OLLAMA SETUP & DIAGNOSTIC MODAL */}
      {showOllamaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-100">
                  Ollama Local Daemon & Model Configuration
                </h3>
              </div>
              <button
                onClick={() => setShowOllamaModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connection Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                ollamaOnline
                  ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
                  : "bg-amber-950/30 border-amber-800/60 text-amber-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                {ollamaOnline ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold">
                    {ollamaOnline ? "Ollama Connected & Active" : "Ollama Daemon Not Detected"}
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    {ollamaOnline
                      ? `Successfully connected to ${ollamaHost}. Found ${availableModels.length} models.`
                      : `Ensure 'ollama serve' is running locally on your computer at ${ollamaHost}.`}
                  </div>
                </div>
              </div>

              <button
                onClick={() => checkOllama()}
                disabled={isCheckingOllama}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1 shrink-0 border border-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingOllama ? "animate-spin" : ""}`} />
                <span>Test</span>
              </button>
            </div>

            {/* Quick Terminal Startup Instructions */}
            <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px]">
              <div className="text-slate-400 font-sans font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  Terminal Commands to Start Ollama:
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                  <code className="text-amber-300 text-[11px]">OLLAMA_ORIGINS="*" ollama serve</code>
                  <button
                    onClick={() => copyToClipboard('OLLAMA_ORIGINS="*" ollama serve', "serve")}
                    className="text-[10px] text-slate-400 hover:text-slate-100 flex items-center gap-1"
                  >
                    {copiedCmd === "serve" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === "serve" ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                  <code className="text-cyan-300 text-[11px]">ollama run llama3.2</code>
                  <button
                    onClick={() => copyToClipboard("ollama run llama3.2", "run")}
                    className="text-[10px] text-slate-400 hover:text-slate-100 flex items-center gap-1"
                  >
                    {copiedCmd === "run" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === "run" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Ollama Service Host
                </label>
                <input
                  type="text"
                  value={ollamaHost}
                  onChange={(e) => setOllamaHost(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Selected Model
                </label>
                {availableModels.length > 0 ? (
                  <select
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {availableModels.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} {m.size ? `(${m.size})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    placeholder="llama3.2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setShowOllamaModal(false);
                  checkOllama();
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE 1: WORKSPACE & RISK SUMMARY */}
      {currentPage === "workspace" && (
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
          {/* CRUD Risk Rules Panel (If Toggled) */}
          {showRiskManager && (
            <RiskProfileManager
              rules={riskRules}
              onSaveRules={(updated) => setRiskRules(updated)}
              onResetDefaultRules={() => setRiskRules(DEFAULT_RISK_RULES)}
            />
          )}

          {/* 1. TOP: Document Upload Part */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-amber-500" />
                Document Source
              </h2>

              {documents.length > 0 && (
                <button
                  onClick={() => {
                    setDocuments(SAMPLE_DOCUMENTS);
                    setActiveDocId(SAMPLE_DOCUMENTS[0].id);
                  }}
                  className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
                >
                  Load Sample Docs
                </button>
              )}
            </div>

            {/* Upload Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md,.json,.csv"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-slate-900 rounded-full text-slate-400">
                  <UploadCloud className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {isParsing ? "Parsing document..." : "Drag & drop your document here, or browse"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports PDF, DOCX, TXT, MD, JSON, CSV files (Auto Entity & Relationship Extraction)
                  </p>
                </div>
              </div>
            </div>

            {/* Current Active Document Badge & Switcher */}
            {currentDoc && (
              <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="p-2 bg-slate-900 rounded-lg text-amber-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-slate-200 truncate">{currentDoc.name}</p>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span>{currentDoc.type.toUpperCase()}</span>
                      <span>•</span>
                      <span>{currentDoc.wordCount} words</span>
                      <span>•</span>
                      <span>{roundSize(currentDoc.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {/* Entity Graph Quick Link Badge */}
                  {currentExportData && (
                    <button
                      onClick={() => setCurrentPage("entity-graph")}
                      className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 text-cyan-300 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
                      title="Open Entities & Links JSON Export"
                    >
                      <Network className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{currentExportData.entities.length} Entities JSON</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {documents.length > 1 ? (
                    <select
                      value={activeDocId}
                      onChange={(e) => setActiveDocId(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
                    >
                      {documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name.slice(0, 24)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-slate-400 hover:text-amber-400 underline underline-offset-2 px-2"
                    >
                      Change File
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. MIDDLE: Action Buttons (Summarize & Risk Analysis) + Question Textfield */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Button 1: Summarize */}
              <button
                id="btn-summarize-doc"
                onClick={handleSummarize}
                disabled={isLoading || !currentDoc}
                className={`py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-md ${
                  isLoading || !currentDoc
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-[0.995]"
                }`}
              >
                {isLoading && outputTitle.startsWith("Summary:") ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Summarizing with LLM...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Summarize Document</span>
                  </>
                )}
              </button>

              {/* Button 2: Risk Profile Analysis */}
              <button
                id="btn-analyze-risk"
                onClick={handleAnalyzeRisk}
                disabled={isLoading || !currentDoc}
                className={`py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-md border ${
                  isLoading || !currentDoc
                    ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                    : "bg-slate-950 hover:bg-slate-900 text-amber-400 border-amber-500/60 active:scale-[0.995]"
                }`}
              >
                {isLoading && outputTitle.startsWith("Risk Profile") ? (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span>Evaluating Risk Formulas...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Analyze Risk Profile</span>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                or ask a question
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Textfield for Asking Questions */}
            <form onSubmit={handleAskQuestion} className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about this document..."
                disabled={isLoading || !currentDoc}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 disabled:opacity-50 placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim() || !currentDoc}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                  isLoading || !question.trim() || !currentDoc
                    ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                    : "bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                }`}
              >
                {isLoading && outputTitle.startsWith("Q:") ? (
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ask</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* 3. BOTTOM: Risk Scorecard Visual Component (If Risk Analyzed) */}
          {riskAnalysisResult && !isLoading && (
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-200">
                    Risk Assessment Matrix & Extracted Variables
                  </h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                    riskAnalysisResult.riskLevel === "Critical"
                      ? "bg-rose-950 text-rose-400 border border-rose-800"
                      : riskAnalysisResult.riskLevel === "High"
                      ? "bg-amber-950 text-amber-400 border border-amber-800"
                      : riskAnalysisResult.riskLevel === "Medium"
                      ? "bg-sky-950 text-sky-400 border border-sky-800"
                      : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                  }`}
                >
                  Score: {riskAnalysisResult.totalRiskScore}% ({riskAnalysisResult.riskLevel.toUpperCase()} RISK)
                </span>
              </div>

              {/* Extracted Variables Mapping Table */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Table className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. LLM Word-to-Variable Extraction Mapping</span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/80 text-[11px] text-slate-400 border-b border-slate-800 font-mono">
                      <tr>
                        <th className="p-2.5">Variable</th>
                        <th className="p-2.5">Document Snippet Matched</th>
                        <th className="p-2.5">Normalized Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {riskAnalysisResult.extractedVariables.map((varItem, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-amber-400">{varItem.variableName}</td>
                          <td className="p-2.5 text-slate-300 italic font-sans">"{varItem.rawSnippet}"</td>
                          <td className="p-2.5 font-bold text-emerald-400">
                            {varItem.foundValue !== null ? String(varItem.foundValue) : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Formulations Evaluation List */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. CRUD Risk Formulas Evaluation</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {riskAnalysisResult.evaluatedRules.map((rule) => (
                    <div
                      key={rule.ruleId}
                      className={`p-3 rounded-xl border flex items-start justify-between text-xs transition-colors ${
                        rule.triggered
                          ? "bg-amber-950/20 border-amber-800/80 text-amber-200"
                          : "bg-slate-950 border-slate-800/80 text-slate-400 opacity-75"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {rule.triggered ? (
                            <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          <span className="font-bold text-slate-100">{rule.description}</span>
                          <span className="font-mono text-[11px] bg-slate-900 px-2 py-0.5 rounded text-amber-300">
                            Formula: {rule.expectedCondition}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 pl-6">
                          Actual: <span className="font-mono font-bold text-slate-100">{String(rule.actualValue)}</span> — {rule.message}
                        </p>
                      </div>

                      <span className="font-mono font-bold text-xs shrink-0 pl-2">
                        {rule.triggered ? `+${rule.riskImpactPercent}% Risk` : "Passed"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. BOTTOM: Generated Output / Markdown Text Output */}
          {(outputContent || isLoading) && (
            <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2 overflow-hidden pr-2">
                  <h3 className="text-xs font-bold text-slate-200 truncate">
                    {outputTitle || "Output"}
                  </h3>
                  {outputEngine && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-amber-400 border border-slate-700 shrink-0">
                      {outputEngine}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handleCopy}
                    disabled={!outputContent}
                    className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                    title="Copy"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={!outputContent}
                    className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                    title="Download .md"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 min-h-[140px] font-sans text-xs text-slate-200 leading-relaxed overflow-x-auto border border-slate-800/60">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10 space-x-2 text-slate-400">
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Processing document with LLM...</span>
                  </div>
                ) : (
                  <div className="markdown-body prose prose-invert max-w-none text-xs text-slate-200 space-y-2">
                    <Markdown>{outputContent}</Markdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      {/* PAGE 2: ENTITIES & LINKS JSON EXPORT PAGE */}
      {currentPage === "entity-graph" && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          <EntityGraphPage
            document={currentDoc}
            exportData={currentExportData}
            isExtracting={isExtractingGraph}
            onReExtract={() => currentDoc && triggerEntityExtraction(currentDoc)}
            ollamaHost={ollamaHost}
            ollamaModel={ollamaModel}
            ollamaOnline={ollamaOnline}
          />
        </main>
      )}

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900/80 py-4 text-center text-[11px] text-slate-600">
        Ollama Local Document AI • Entity Extraction & Knowledge Graph Engine
      </footer>
    </div>
  );
}

function roundSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
