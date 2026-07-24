import React, { useState } from "react";
import { FileText, Eye, Trash2, CheckCircle2, FileType, Hash, AlignLeft, X } from "lucide-react";
import { DocumentFile } from "../types";

interface DocumentListProps {
  documents: DocumentFile[];
  selectedDocIds: string[];
  onToggleSelectDoc: (id: string) => void;
  onSelectAll: () => void;
  onDeleteDoc: (id: string) => void;
  onClearAll: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocIds,
  onToggleSelectDoc,
  onSelectAll,
  onDeleteDoc,
  onClearAll,
}) => {
  const [viewingDoc, setViewingDoc] = useState<DocumentFile | null>(null);

  if (documents.length === 0) {
    return null;
  }

  const allSelected = documents.length > 0 && selectedDocIds.length === documents.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-semibold text-slate-100">
            Loaded Documents ({documents.length})
          </h3>
          <span className="text-xs px-2 py-0.5 bg-slate-800 text-amber-400 font-mono rounded-md border border-slate-700">
            {selectedDocIds.length} selected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onSelectAll}
            className="text-xs text-slate-300 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </button>
          <button
            onClick={onClearAll}
            className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 px-2.5 py-1 rounded-lg border border-rose-800/40 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {documents.map((doc) => {
          const isSelected = selectedDocIds.includes(doc.id);

          return (
            <div
              key={doc.id}
              onClick={() => onToggleSelectDoc(doc.id)}
              className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-800/90 border-amber-500/80 shadow-sm"
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between space-x-3">
                <div className="flex items-start space-x-3 overflow-hidden">
                  <div
                    className={`mt-0.5 p-2 rounded-lg ${
                      isSelected
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-800 text-slate-400 group-hover:text-amber-400"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-semibold text-slate-100 truncate group-hover:text-amber-400 transition-colors">
                      {doc.name}
                    </h4>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Hash className="w-3 h-3 text-slate-500" />
                        {doc.wordCount.toLocaleString()} words
                      </span>
                      {doc.pageCount && (
                        <span className="flex items-center gap-1 font-mono">
                          <FileType className="w-3 h-3 text-slate-500" />
                          {doc.pageCount} pages
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingDoc(doc);
                    }}
                    title="View Extracted Text"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDoc(doc.id);
                    }}
                    title="Remove File"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/80 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text Preview Snippet */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400 line-clamp-2 font-mono">
                {doc.text.slice(0, 160)}...
              </div>
            </div>
          );
        })}
      </div>

      {/* Viewing Text Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-slate-100 text-sm">{viewingDoc.name}</h3>
                <span className="text-xs bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono">
                  {viewingDoc.wordCount.toLocaleString()} words
                </span>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed space-y-2 whitespace-pre-wrap bg-slate-950/60">
              {viewingDoc.text}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900 flex justify-end">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl"
              >
                Close Text Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
