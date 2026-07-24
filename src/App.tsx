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
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FolderPlus,
  FileCheck,
} from "lucide-react";
import { parseUploadedFile } from "./utils/documentParser";
import { SAMPLE_DOCUMENTS } from "./data/sampleDocs";
import { DocumentFile } from "./types";

export default function App() {
  const [documents, setDocuments] = useState<DocumentFile[]>(SAMPLE_DOCUMENTS);
  const [activeDocId, setActiveDocId] = useState<string>(SAMPLE_DOCUMENTS[0].id);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Question & Summary state
  const [question, setQuestion] = useState<string>("");
  const [outputTitle, setOutputTitle] = useState<string>("");
  const [outputContent, setOutputContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Ollama status
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [ollamaHost] = useState<string>("http://localhost:11434");
  const [ollamaModel] = useState<string>("llama3.2");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active document object
  const currentDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  // Check Ollama status on mount
  const checkOllama = async () => {
    try {
      const res = await fetch("/api/ollama/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: ollamaHost }),
      });
      if (res.ok) {
        const data = await res.json();
        setOllamaOnline(data.online);
      } else {
        setOllamaOnline(false);
      }
    } catch {
      setOllamaOnline(false);
    }
  };

  useEffect(() => {
    checkOllama();
  }, []);

  // Handle uploaded files
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
      setActiveDocId(parsedResults[0].id);
    }
    setIsParsing(false);
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
    setOutputTitle(`Summary: ${currentDoc.name}`);
    setOutputContent("");

    const promptText = `Please provide a clear, comprehensive, and well-structured summary of the following document titled "${currentDoc.name}". Use markdown formatting with bullet points and key takeaways.\n\nDocument Content:\n${currentDoc.text.slice(0, 16000)}`;

    try {
      const res = await fetch("/api/ollama/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: ollamaHost,
          model: ollamaModel,
          prompt: promptText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOutputContent(data.response || "No response generated.");
      } else {
        throw new Error("Local Ollama offline");
      }
    } catch {
      // Fallback to Gemini
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
          setOutputContent(data.summary || "Summary generated successfully.");
        }
      } catch (err: any) {
        setOutputContent(`Error generating summary: ${err.message || err}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Ask Question
  const handleAskQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || !currentDoc || isLoading) return;

    const userQ = question.trim();
    setIsLoading(true);
    setOutputTitle(`Q: ${userQ}`);
    setOutputContent("");

    const promptText = `Document Title: "${currentDoc.name}"\nDocument Text:\n${currentDoc.text.slice(0, 16000)}\n\nQuestion: ${userQ}\n\nPlease answer the question concisely and accurately based ONLY on the document provided above. Use Markdown if formatting helps readability.`;

    try {
      const res = await fetch("/api/ollama/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: ollamaHost,
          model: ollamaModel,
          prompt: promptText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOutputContent(data.response || "No answer generated.");
      } else {
        throw new Error("Local Ollama offline");
      }
    } catch {
      // Fallback to Gemini
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
          setOutputContent(data.summary || "Answer generated.");
        }
      } catch (err: any) {
        setOutputContent(`Error answering question: ${err.message || err}`);
      }
    } finally {
      setIsLoading(false);
      setQuestion("");
    }
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
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-slate-950 flex flex-col justify-between">
      {/* Minimal Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-950 text-sm shadow-sm">
              <FileText className="w-4 h-4 text-slate-950" />
            </div>
            <span className="font-bold text-slate-100 text-sm tracking-tight">
              Ollama Document AI
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                ollamaOnline
                  ? "bg-emerald-950/50 border-emerald-800/60 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
            >
              {ollamaOnline ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3 h-3 text-slate-500" />
              )}
              <span>{ollamaOnline ? "Ollama: Connected" : "Local Model AI"}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Single-Column Minimal Interface */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
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
                Load Sample Doc
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
                : "border-slate-800 hover:border-amber-500/50 bg-slate-950/60 hover:bg-slate-950/90"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.md,.json,.csv"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            {isParsing ? (
              <div className="flex items-center justify-center space-x-2 py-2">
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-amber-400 font-medium">Extracting document text...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-1.5">
                <FolderPlus className="w-6 h-6 text-amber-500/80 mb-1" />
                <p className="text-xs text-slate-200">
                  <span className="font-bold text-amber-400">Click to upload document</span> or drag and drop file
                </p>
                <p className="text-[11px] text-slate-500">
                  Supports PDF, Word DOCX, Markdown, and TXT files
                </p>
              </div>
            )}
          </div>

          {/* Current Active Document Selector / Pill */}
          {currentDoc && (
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-slate-200 truncate">
                    {currentDoc.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {currentDoc.wordCount.toLocaleString()} words • {roundSize(currentDoc.size)}
                  </div>
                </div>
              </div>

              {documents.length > 1 ? (
                <select
                  value={activeDocId}
                  onChange={(e) => setActiveDocId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-500"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name.slice(0, 25)}
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
          )}
        </div>

        {/* 2. MIDDLE: Summarization Button + Question Textfield */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-sm space-y-4">
          {/* Button for Summarization */}
          <button
            id="btn-summarize-doc"
            onClick={handleSummarize}
            disabled={isLoading || !currentDoc}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-md ${
              isLoading || !currentDoc
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : "bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-[0.995]"
            }`}
          >
            {isLoading && outputTitle.startsWith("Summary:") ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Summarizing Document...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Summarize Document</span>
              </>
            )}
          </button>

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

        {/* 3. BOTTOM: Generated Output / Answer Section */}
        {(outputContent || isLoading) && (
          <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-xs font-bold text-slate-200 truncate pr-2">
                {outputTitle || "Output"}
              </h3>

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

      {/* Minimal Footer */}
      <footer className="border-t border-slate-900/80 py-4 text-center text-[11px] text-slate-600">
        Ollama Local Document Reader • Privacy-First LLM Summarization
      </footer>
    </div>
  );
}

function roundSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
