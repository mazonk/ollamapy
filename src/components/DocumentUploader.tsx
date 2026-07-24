import React, { useRef, useState } from "react";
import { UploadCloud, FileText, Sparkles, FolderPlus, FileCheck } from "lucide-react";
import { parseUploadedFile } from "../utils/documentParser";
import { DocumentFile } from "../types";

interface DocumentUploaderProps {
  onFilesParsed: (files: DocumentFile[]) => void;
  onLoadSamples: () => void;
  isParsing: boolean;
  setIsParsing: (val: boolean) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onFilesParsed,
  onLoadSamples,
  isParsing,
  setIsParsing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    setIsParsing(true);

    const parsedResults: DocumentFile[] = [];
    for (let i = 0; i < filesList.length; i++) {
      try {
        const parsed = await parseUploadedFile(filesList[i]);
        parsedResults.push(parsed);
      } catch (err) {
        console.error("Failed to parse file:", filesList[i].name, err);
      }
    }

    onFilesParsed(parsedResults);
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
      await handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-500" />
            Upload Documents
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Drop PDF, Word (DOCX), Markdown, or TXT files to read and summarize locally.
          </p>
        </div>

        <button
          id="btn-load-sample-docs"
          onClick={onLoadSamples}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Load Sample Docs</span>
        </button>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-amber-500 bg-amber-500/10 scale-[0.99]"
            : "border-slate-700/80 hover:border-amber-500/60 bg-slate-950/50 hover:bg-slate-950/80"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.md,.json,.csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isParsing ? (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium text-amber-400">Extracting text & page structure...</p>
            <p className="text-xs text-slate-500 mt-1">Reading document content</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-slate-800/80 text-amber-400 rounded-2xl flex items-center justify-center shadow-inner border border-slate-700">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                <span className="text-amber-400 underline underline-offset-4 font-semibold">
                  Click to browse
                </span>{" "}
                or drag & drop files here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports PDF, DOCX, TXT, MD, JSON, CSV (up to 50MB per file)
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <span className="px-2.5 py-1 bg-slate-800/60 rounded-md text-[11px] text-slate-400 border border-slate-700/50 flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-emerald-400" /> PDF Reader
              </span>
              <span className="px-2.5 py-1 bg-slate-800/60 rounded-md text-[11px] text-slate-400 border border-slate-700/50 flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-emerald-400" /> Word DOCX
              </span>
              <span className="px-2.5 py-1 bg-slate-800/60 rounded-md text-[11px] text-slate-400 border border-slate-700/50 flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-emerald-400" /> Plain Text & MD
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
