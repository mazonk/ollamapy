import React, { useState } from "react";
import { RiskRule } from "../types";
import {
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  X,
  Sliders,
  AlertTriangle,
  Info,
} from "lucide-react";

interface RiskProfileManagerProps {
  rules: RiskRule[];
  onSaveRules: (newRules: RiskRule[]) => void;
  onResetDefaultRules: () => void;
}

export function RiskProfileManager({
  rules,
  onSaveRules,
  onResetDefaultRules,
}: RiskProfileManagerProps) {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Form state
  const [formState, setFormState] = useState<Partial<RiskRule>>({
    variableName: "",
    description: "",
    operator: ">",
    thresholdValue: 30000,
    unit: "kg",
    riskImpactPercent: 20,
    severity: "medium",
    messageIfTriggered: "",
  });

  const handleStartAdd = () => {
    setFormState({
      variableName: "cargo_load",
      description: "Cargo Weight Limit",
      operator: ">",
      thresholdValue: 30000,
      unit: "kg",
      riskImpactPercent: 25,
      severity: "high",
      messageIfTriggered: "Cargo load exceeds maximum threshold",
    });
    setIsAddingNew(true);
    setEditingRuleId(null);
  };

  const handleStartEdit = (rule: RiskRule) => {
    setFormState(rule);
    setEditingRuleId(rule.id);
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    onSaveRules(rules.filter((r) => r.id !== id));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.variableName || !formState.description) return;

    if (isAddingNew) {
      const newRule: RiskRule = {
        id: `rule-${Date.now()}`,
        variableName: formState.variableName.toLowerCase().trim().replace(/\s+/g, "_"),
        description: formState.description.trim(),
        operator: formState.operator || ">",
        thresholdValue: formState.thresholdValue ?? 0,
        unit: formState.unit || "",
        riskImpactPercent: Number(formState.riskImpactPercent) || 10,
        severity: formState.severity || "medium",
        messageIfTriggered: formState.messageIfTriggered || "Risk formula threshold reached",
      };
      onSaveRules([...rules, newRule]);
      setIsAddingNew(false);
    } else if (editingRuleId) {
      const updatedRules = rules.map((r) => {
        if (r.id === editingRuleId) {
          return {
            ...r,
            variableName: formState.variableName!.toLowerCase().trim().replace(/\s+/g, "_"),
            description: formState.description!.trim(),
            operator: formState.operator || ">",
            thresholdValue: formState.thresholdValue ?? r.thresholdValue,
            unit: formState.unit || "",
            riskImpactPercent: Number(formState.riskImpactPercent) || 10,
            severity: formState.severity || "medium",
            messageIfTriggered: formState.messageIfTriggered || "Threshold exceeded",
          } as RiskRule;
        }
        return r;
      });
      onSaveRules(updatedRules);
      setEditingRuleId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            CRUD Risk Formulas & Variables
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onResetDefaultRules}
            className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center space-x-1 transition-colors px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg"
            title="Reset to vessel risk defaults"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Formulas</span>
          </button>

          <button
            onClick={handleStartAdd}
            disabled={isAddingNew}
            className="text-[11px] font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 flex items-center space-x-1 transition-all px-2.5 py-1 rounded-lg shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Formula</span>
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Define risk assessment formulas. When analyzing documents, the LLM extracts unstructured text words (e.g. <span className="text-amber-400 font-mono">"Cargo load: 34,500kg"</span>) into connected formula variables (<span className="text-amber-400 font-mono">cargo_load = 34500</span>) to evaluate risk scores automatically.
      </p>

      {/* Add / Edit Form Modal Box */}
      {(isAddingNew || editingRuleId) && (
        <form
          onSubmit={handleSaveForm}
          className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              {isAddingNew ? "Create New Risk Formula" : "Edit Risk Formula"}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingRuleId(null);
              }}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Variable Name (e.g. cargo_load)
              </label>
              <input
                type="text"
                value={formState.variableName || ""}
                onChange={(e) => setFormState({ ...formState, variableName: e.target.value })}
                placeholder="cargo_load"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Description / Rule Title
              </label>
              <input
                type="text"
                value={formState.description || ""}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                placeholder="Cargo Weight Limit"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Operator</label>
                <select
                  value={formState.operator || ">"}
                  onChange={(e) => setFormState({ ...formState, operator: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="==">==</option>
                  <option value="!=">!=</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Threshold</label>
                <input
                  type="text"
                  value={formState.thresholdValue !== undefined ? String(formState.thresholdValue) : ""}
                  onChange={(e) => setFormState({ ...formState, thresholdValue: e.target.value })}
                  placeholder="30000"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Unit</label>
                <input
                  type="text"
                  value={formState.unit || ""}
                  onChange={(e) => setFormState({ ...formState, unit: e.target.value })}
                  placeholder="kg / yrs"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Risk Impact (+%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formState.riskImpactPercent || 20}
                  onChange={(e) => setFormState({ ...formState, riskImpactPercent: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Severity Badge</label>
                <select
                  value={formState.severity || "medium"}
                  onChange={(e) => setFormState({ ...formState, severity: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">
                Risk Warning Message
              </label>
              <input
                type="text"
                value={formState.messageIfTriggered || ""}
                onChange={(e) => setFormState({ ...formState, messageIfTriggered: e.target.value })}
                placeholder="Cargo weight exceeds 30,000 kg safety limit"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false);
                setEditingRuleId(null);
              }}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Formula</span>
            </button>
          </div>
        </form>
      )}

      {/* Rules List / Table */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between text-xs transition-colors"
          >
            <div className="space-y-1 overflow-hidden pr-2">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[11px]">
                  {rule.variableName}
                </span>

                <span className="font-mono text-slate-300 font-bold">
                  {rule.operator} {String(rule.thresholdValue)} {rule.unit}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    rule.severity === "critical"
                      ? "bg-rose-950 text-rose-400 border border-rose-800"
                      : rule.severity === "high"
                      ? "bg-amber-950 text-amber-400 border border-amber-800"
                      : rule.severity === "medium"
                      ? "bg-sky-950 text-sky-400 border border-sky-800"
                      : "bg-slate-900 text-slate-400 border border-slate-800"
                  }`}
                >
                  {rule.severity} (+{rule.riskImpactPercent}%)
                </span>
              </div>

              <div className="text-slate-300 text-xs font-semibold">{rule.description}</div>
              <div className="text-[11px] text-slate-500 truncate">{rule.messageIfTriggered}</div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={() => handleStartEdit(rule)}
                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-lg transition-colors"
                title="Edit rule"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(rule.id)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                title="Delete rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
