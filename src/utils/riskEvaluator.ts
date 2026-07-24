import {
  RiskRule,
  ExtractedVariable,
  RiskEvaluationResult,
  DocumentRiskAnalysisResult,
  DocumentFile,
} from "../types";

export async function analyzeDocumentRisk(
  document: DocumentFile,
  rules: RiskRule[],
  ollamaHost: string,
  ollamaModel: string
): Promise<DocumentRiskAnalysisResult> {
  const variableNames = rules.map((r) => r.variableName);
  const variableDescriptions = rules.map((r) => `${r.variableName} (${r.description}, unit: ${r.unit || 'none'})`).join("\n");

  const promptText = `You are a document entity & variable extraction system.
Analyze the following document and extract exact numerical or boolean values for these specific variables:

VARIABLES TO EXTRACT:
${variableDescriptions}

CRITICAL RULES FOR EXTRACTION:
1. "cargo_load": Extract total weight as a clean number in kilograms (e.g., "34,500 kg" -> 34500, "4.2 metric tons" or "4,200kg" -> 4200).
2. "vessel_age": Extract age as a number in years.
3. "hazardous_cargo": Extract boolean true if hazardous/flammable goods are present, otherwise false.
4. "inspection_overdue_days": Extract overdue days as a number (e.g. 52).
5. "draft_depth": Extract draft depth in meters as a decimal number (e.g. 12.8).
6. "crew_count": Extract total crew count as a number (e.g. 14).

Return ONLY a valid JSON array formatted strictly like this with no markdown wrappers or extra prose:
[
  {
    "variableName": "cargo_load",
    "foundValue": 34500,
    "rawSnippet": "Total Declared Cargo Load: 34,500 kg"
  }
]

DOCUMENT CONTENT:
"${document.name}"
${document.text.slice(0, 12000)}`;

  let extractedVariables: ExtractedVariable[] = [];

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
      extractedVariables = parseExtractedJson(data.response, variableNames);
    } else {
      throw new Error("Ollama offline");
    }
  } catch {
    // Fallback to Gemini
    try {
      const res = await fetch("/api/gemini/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: document.text,
          documentName: document.name,
          mode: "custom",
          customPrompt: promptText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        extractedVariables = parseExtractedJson(data.summary, variableNames);
      }
    } catch (err) {
      console.warn("Gemini fallback extraction error:", err);
    }
  }

  // Backup regex extraction if LLM missed any variables
  extractedVariables = fillRegexFallbacks(document.text, variableNames, extractedVariables);

  // Evaluate Rules against extracted variables
  const evaluatedRules: RiskEvaluationResult[] = [];
  let totalRiskScore = 0;

  for (const rule of rules) {
    const extracted = extractedVariables.find((v) => v.variableName === rule.variableName);
    const actualVal = extracted ? extracted.foundValue : null;

    const triggered = evaluateFormula(actualVal, rule.operator, rule.thresholdValue);
    if (triggered) {
      totalRiskScore += rule.riskImpactPercent;
    }

    evaluatedRules.push({
      ruleId: rule.id,
      variableName: rule.variableName,
      description: rule.description,
      expectedCondition: `${rule.variableName} ${rule.operator} ${rule.thresholdValue}${rule.unit ? ' ' + rule.unit : ''}`,
      actualValue: actualVal !== null ? `${actualVal}${rule.unit ? ' ' + rule.unit : ''}` : "Not found in text",
      triggered,
      riskImpactPercent: rule.riskImpactPercent,
      severity: rule.severity,
      message: rule.messageIfTriggered,
    });
  }

  const clampedScore = Math.min(100, Math.max(0, totalRiskScore));
  let riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (clampedScore >= 75) riskLevel = 'Critical';
  else if (clampedScore >= 50) riskLevel = 'High';
  else if (clampedScore >= 25) riskLevel = 'Medium';

  const aiRiskSummary = generateRiskSummaryText(document.name, clampedScore, riskLevel, evaluatedRules);

  return {
    documentName: document.name,
    totalRiskScore: clampedScore,
    riskLevel,
    extractedVariables,
    evaluatedRules,
    aiRiskSummary,
  };
}

// Formula evaluation
function evaluateFormula(
  actual: number | string | boolean | null,
  operator: string,
  threshold: number | string | boolean
): boolean {
  if (actual === null || actual === undefined) return false;

  // Convert types if numeric
  let numActual = typeof actual === 'number' ? actual : parseFloat(String(actual).replace(/,/g, ''));
  let numThreshold = typeof threshold === 'number' ? threshold : parseFloat(String(threshold));

  if (!isNaN(numActual) && !isNaN(numThreshold)) {
    switch (operator) {
      case '>': return numActual > numThreshold;
      case '<': return numActual < numThreshold;
      case '>=': return numActual >= numThreshold;
      case '<=': return numActual <= numThreshold;
      case '==': return numActual === numThreshold;
      case '!=': return numActual !== numThreshold;
      default: return false;
    }
  }

  // Boolean or String matching
  const boolActual = String(actual).toLowerCase() === 'true' || actual === true;
  const boolThreshold = String(threshold).toLowerCase() === 'true' || threshold === true;

  switch (operator) {
    case '==': return boolActual === boolThreshold;
    case '!=': return boolActual !== boolThreshold;
    default: return false;
  }
}

// Clean JSON response parsing
function parseExtractedJson(rawText: string, targetVars: string[]): ExtractedVariable[] {
  if (!rawText) return [];

  try {
    const jsonMatch = rawText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawText;
    const parsed = JSON.parse(jsonString);

    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        variableName: String(item.variableName || item.variable || ""),
        foundValue: normalizeValue(item.foundValue ?? item.value),
        rawSnippet: String(item.rawSnippet || item.snippet || "Extracted from document"),
      }));
    }
  } catch {
    // Ignore JSON parse error, fall back to regex
  }

  return [];
}

function normalizeValue(val: any): number | string | boolean | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val;

  const str = String(val).trim();
  if (str.toLowerCase() === 'true') return true;
  if (str.toLowerCase() === 'false') return false;

  const num = parseFloat(str.replace(/,/g, ''));
  if (!isNaN(num)) return num;

  return str;
}

// Regex Fallbacks to guarantee extraction
function fillRegexFallbacks(text: string, targetVars: string[], existing: ExtractedVariable[]): ExtractedVariable[] {
  const result: ExtractedVariable[] = [...existing];

  const getVar = (vName: string) => result.find((item) => item.variableName === vName);

  // cargo_load
  if (!getVar("cargo_load") || getVar("cargo_load")?.foundValue === null) {
    const match = text.match(/(?:Cargo Load|Cargo Weight|Declared Cargo Load|Load)[:\s]+([0-9,.]+)\s*(kg|metric tons|tons)/i);
    if (match) {
      let val = parseFloat(match[1].replace(/,/g, ''));
      if (match[2].toLowerCase().includes("ton")) val *= 1000;
      result.push({
        variableName: "cargo_load",
        foundValue: val,
        rawSnippet: match[0],
      });
    }
  }

  // vessel_age
  if (!getVar("vessel_age") || getVar("vessel_age")?.foundValue === null) {
    const match = text.match(/(?:Vessel Age|Calculated Vessel Age|Age)[:\s]+([0-9]+)\s*years/i);
    if (match) {
      result.push({
        variableName: "vessel_age",
        foundValue: parseInt(match[1], 10),
        rawSnippet: match[0],
      });
    }
  }

  // hazardous_cargo
  if (!getVar("hazardous_cargo") || getVar("hazardous_cargo")?.foundValue === null) {
    const match = text.match(/(?:Hazardous Goods|Hazardous Cargo|Class 3 Flammable)[:\s]+(YES|True|Class 3|Contains)/i);
    result.push({
      variableName: "hazardous_cargo",
      foundValue: !!match,
      rawSnippet: match ? match[0] : "No hazardous classification found",
    });
  }

  // inspection_overdue_days
  if (!getVar("inspection_overdue_days") || getVar("inspection_overdue_days")?.foundValue === null) {
    const match = text.match(/(?:Overdue Status|Overdue by|Inspection Overdue)[:\s]+(?:Overdue by\s+)?([0-9]+)\s*days/i);
    if (match) {
      result.push({
        variableName: "inspection_overdue_days",
        foundValue: parseInt(match[1], 10),
        rawSnippet: match[0],
      });
    }
  }

  // draft_depth
  if (!getVar("draft_depth") || getVar("draft_depth")?.foundValue === null) {
    const match = text.match(/(?:Draft Depth|Measured Draft Depth)[:\s]+([0-9.]+)\s*meters/i);
    if (match) {
      result.push({
        variableName: "draft_depth",
        foundValue: parseFloat(match[1]),
        rawSnippet: match[0],
      });
    }
  }

  // crew_count
  if (!getVar("crew_count") || getVar("crew_count")?.foundValue === null) {
    const match = text.match(/(?:Active Crew Manning|Crew Size|Crew Count)[:\s]+([0-9]+)/i);
    if (match) {
      result.push({
        variableName: "crew_count",
        foundValue: parseInt(match[1], 10),
        rawSnippet: match[0],
      });
    }
  }

  return result;
}

function generateRiskSummaryText(
  docName: string,
  score: number,
  level: string,
  evaluated: RiskEvaluationResult[]
): string {
  const triggeredRules = evaluated.filter((r) => r.triggered);

  let summary = `### Risk Scorecard: ${score}% (${level} Risk Level)\n\n`;
  summary += `Document **"${docName}"** was evaluated against **${evaluated.length} active risk formulas**.\n\n`;

  if (triggeredRules.length === 0) {
    summary += `✅ **All safety & operational conditions satisfied.** No risk thresholds were breached.\n`;
  } else {
    summary += `⚠️ **${triggeredRules.length} Risk Rule(s) Triggered:**\n\n`;
    triggeredRules.forEach((rule) => {
      summary += `- **[${rule.severity.toUpperCase()}] ${rule.description}**: Value \`${rule.actualValue}\` triggered condition \`${rule.expectedCondition}\`. *(${rule.message})*\n`;
    });

    summary += `\n**Recommended Corrective Actions:**\n`;
    if (triggeredRules.some((r) => r.variableName === "cargo_load")) {
      summary += `- **Cargo Offloading Required**: Offload excess tonnage to bring cargo under 30,000 kg limit prior to port departure.\n`;
    }
    if (triggeredRules.some((r) => r.variableName === "inspection_overdue_days")) {
      summary += `- **Immediate Inspection Required**: Schedule drydock safety audit before entering international maritime corridors.\n`;
    }
    if (triggeredRules.some((r) => r.variableName === "hazardous_cargo")) {
      summary += `- **Flammable Spill Protocol**: Ensure Class 3 fire suppression systems and hazmat documentation are verified.\n`;
    }
  }

  return summary;
}
