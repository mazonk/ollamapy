import React, { useState } from "react";
import {
  DocumentFile,
  DocumentEntitiesExportJSON,
  StructuredEntity,
  StructuredLink,
  ENTITY_TYPE_DEFINITIONS,
  LINK_TYPE_DEFINITIONS,
} from "../types";
import {
  FileCode,
  Download,
  Copy,
  Check,
  RefreshCw,
  Search,
  Cpu,
  Layers,
  ArrowRight,
  Database,
  Table,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface EntityGraphPageProps {
  document: DocumentFile | null;
  exportData: DocumentEntitiesExportJSON | null;
  isExtracting: boolean;
  onReExtract: () => void;
  ollamaHost: string;
  ollamaModel: string;
  ollamaOnline: boolean | null;
}

export function EntityGraphPage({
  document,
  exportData,
  isExtracting,
  onReExtract,
  ollamaHost,
  ollamaModel,
  ollamaOnline,
}: EntityGraphPageProps) {
  const [activeTab, setActiveTab] = useState<"json" | "entities" | "links" | "schema">("json");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
        <div className="p-4 bg-slate-800/80 rounded-2xl mb-4 text-slate-400">
          <FileCode className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-sm font-bold text-slate-200">No Document Selected</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Upload or select a document from the Workspace to scan entities and export the JSON schema.
        </p>
      </div>
    );
  }

  const entities = exportData?.entities || [];
  const links = exportData?.links || [];

  // Construct exact output JSON string
  const jsonPayload = {
    entities: entities.map((e) => ({
      id: e.id,
      name: e.name,
      entityTypeId: e.entityTypeId,
    })),
    links: links.map((l) => ({
      id: l.id,
      entityId1: l.entityId1,
      linkTypeId: l.linkTypeId,
      entityId2: l.entityId2,
      strength: Number(l.strength.toFixed(2)),
      source: l.source,
    })),
  };

  const formattedJsonString = JSON.stringify(jsonPayload, null, 2);

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(formattedJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([formattedJsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    const safeName = document.name.replace(/\.[^/.]+$/, "");
    a.href = url;
    a.download = `${safeName}_entities_and_links.json`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Find entity by ID helper
  const getEntityName = (id: number): string => {
    const ent = entities.find((e) => e.id === id);
    return ent ? ent.name : `Entity #${id}`;
  };

  // Filtered lists for table search
  const filteredEntities = entities.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(e.id).includes(searchQuery) ||
      (ENTITY_TYPE_DEFINITIONS[e.entityTypeId]?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLinks = links.filter((l) => {
    const sName = getEntityName(l.entityId1).toLowerCase();
    const tName = getEntityName(l.entityId2).toLowerCase();
    const lType = (LINK_TYPE_DEFINITIONS[l.linkTypeId]?.name || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    return (
      sName.includes(q) ||
      tName.includes(q) ||
      lType.includes(q) ||
      l.source.toLowerCase().includes(q) ||
      String(l.id).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/30">
                <FileCode className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-100">
                JSON Entity & Relationship Extraction
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                Strict Schema
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ollama scans the entire document, strictly extracting verified factual entities and links with auto-assigned IDs into JSON.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download JSON Button */}
            <button
              onClick={handleDownloadJSON}
              disabled={entities.length === 0 || isExtracting}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>

            {/* Copy JSON Button */}
            <button
              onClick={handleCopyJSON}
              disabled={entities.length === 0 || isExtracting}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy JSON"}</span>
            </button>

            {/* Scan / Re-Extract Button */}
            <button
              onClick={onReExtract}
              disabled={isExtracting}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? "animate-spin" : ""}`} />
              <span>{isExtracting ? "Scanning with Ollama..." : "Rescan Document"}</span>
            </button>
          </div>
        </div>

        {/* Engine Status & Document Context Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="text-slate-400">Document:</span>
            <span className="font-semibold text-slate-200 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate max-w-xs">
              {document.name}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{document.wordCount} words</span>
          </div>

          <div className="flex items-center space-x-3 font-mono text-[11px]">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Engine:</span>
              <span className="text-amber-300 font-bold">{ollamaModel}</span>
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              <span className="text-slate-400">Entities:</span>
              <span className="font-bold text-amber-400">{entities.length}</span>
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              <span className="text-slate-400">Links:</span>
              <span className="font-bold text-cyan-400">{links.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("json")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === "json"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Exported JSON</span>
          </button>

          <button
            onClick={() => setActiveTab("entities")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === "entities"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Entities Table ({entities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("links")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === "links"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Links Table ({links.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("schema")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === "schema"
                ? "bg-cyan-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Type ID Legend</span>
          </button>
        </div>

        {activeTab !== "json" && activeTab !== "schema" && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extracted data..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-500 w-full sm:w-60"
            />
          </div>
        )}
      </div>

      {/* TAB 1: JSON VIEWER */}
      {activeTab === "json" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-200">
                JSON File Output (Exact Target Schema)
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyJSON}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center space-x-1 border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={handleDownloadJSON}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs font-mono flex items-center space-x-1 transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>.json</span>
              </button>
            </div>
          </div>

          {isExtracting ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400 font-mono text-xs">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p>Ollama scanning document text and constructing JSON structure...</p>
            </div>
          ) : (
            <div className="relative">
              <pre className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono text-[12px] text-slate-200 overflow-x-auto leading-relaxed max-h-[550px] selection:bg-amber-500/30">
                <code>{formattedJsonString}</code>
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ENTITIES TABLE */}
      {activeTab === "entities" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Table className="w-4 h-4 text-amber-400" />
              <span>Extracted Entities ({filteredEntities.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Auto-assigned numeric IDs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3 w-16 text-center">ID</th>
                  <th className="p-3">Entity Name</th>
                  <th className="p-3 w-32 text-center">entityTypeId</th>
                  <th className="p-3">Entity Type Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[12px]">
                {filteredEntities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-sans">
                      No entities matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredEntities.map((ent) => {
                    const typeDef = ENTITY_TYPE_DEFINITIONS[ent.entityTypeId] || {
                      id: ent.entityTypeId,
                      name: "Other",
                      description: "Custom entity type",
                      color: "#64748b",
                    };
                    return (
                      <tr key={ent.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-center font-bold text-amber-400 bg-slate-950/40">
                          {ent.id}
                        </td>
                        <td className="p-3 font-sans font-semibold text-slate-100">
                          {ent.name}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-bold">
                            {ent.entityTypeId}
                          </span>
                        </td>
                        <td className="p-3 font-sans">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                            style={{
                              backgroundColor: `${typeDef.color}15`,
                              borderColor: `${typeDef.color}40`,
                              color: typeDef.color,
                            }}
                          >
                            {typeDef.name}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LINKS TABLE */}
      {activeTab === "links" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Extracted Relational Links ({filteredLinks.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              entityId1 ➔ entityId2
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="p-3 w-16 text-center">ID</th>
                  <th className="p-3">Source Entity (entityId1)</th>
                  <th className="p-3 text-center">linkTypeId</th>
                  <th className="p-3">Target Entity (entityId2)</th>
                  <th className="p-3 w-28 text-center">Strength</th>
                  <th className="p-3">Source Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[12px]">
                {filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                      No links matching "{searchQuery}"
                    </td>
                  </tr>
                ) : (
                  filteredLinks.map((link) => {
                    const sName = getEntityName(link.entityId1);
                    const tName = getEntityName(link.entityId2);
                    const linkDef = LINK_TYPE_DEFINITIONS[link.linkTypeId] || {
                      id: link.linkTypeId,
                      name: "Related / Affiliated",
                      description: "Direct connection",
                    };

                    return (
                      <tr key={link.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-center font-bold text-cyan-400 bg-slate-950/40">
                          {link.id}
                        </td>
                        <td className="p-3 font-sans">
                          <div className="flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.2 bg-slate-950 text-amber-400 rounded font-mono text-[11px] border border-slate-800">
                              #{link.entityId1}
                            </span>
                            <span className="font-semibold text-slate-200">{sName}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-950 border border-slate-800 text-cyan-300">
                            {link.linkTypeId}: {linkDef.name}
                          </span>
                        </td>
                        <td className="p-3 font-sans">
                          <div className="flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.2 bg-slate-950 text-amber-400 rounded font-mono text-[11px] border border-slate-800">
                              #{link.entityId2}
                            </span>
                            <span className="font-semibold text-slate-200">{tName}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <div className="w-12 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                              <div
                                className="bg-gradient-to-r from-cyan-500 to-amber-500 h-full rounded-full"
                                style={{ width: `${Math.round(link.strength * 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-slate-300 font-bold">
                              {link.strength.toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-400 font-sans text-[11px] italic truncate max-w-xs">
                          {link.source}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SCHEMA & TYPE DEFINITION REFERENCE */}
      {activeTab === "schema" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Entity Types Reference */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Table className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200">
                entityTypeId Reference Definitions
              </h3>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs">
              {Object.values(ENTITY_TYPE_DEFINITIONS).map((t) => (
                <div key={t.id} className="py-2.5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 bg-slate-950 font-mono font-bold text-amber-400 rounded text-[11px] border border-slate-800">
                        ID {t.id}
                      </span>
                      <span className="font-bold text-slate-200">{t.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{t.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Link Types Reference */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200">
                linkTypeId Reference Definitions
              </h3>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs">
              {Object.values(LINK_TYPE_DEFINITIONS).map((l) => (
                <div key={l.id} className="py-2.5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 bg-slate-950 font-mono font-bold text-cyan-400 rounded text-[11px] border border-slate-800">
                        ID {l.id}
                      </span>
                      <span className="font-bold text-slate-200">{l.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{l.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
