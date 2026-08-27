export type SummaryMode = 
  | 'executive' 
  | 'bullets' 
  | 'key_takeaways' 
  | 'action_items' 
  | 'technical' 
  | 'custom';

export type LlmProvider = 'ollama' | 'gemini';

export interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'json' | 'csv';
  text: string;
  pageCount?: number;
  wordCount: number;
  createdAt: string;
}

export interface SummarizeConfig {
  provider: LlmProvider;
  ollamaHost: string;
  ollamaModel: string;
  mode: SummaryMode;
  customPrompt: string;
  chunkSize: number;
  overlap: number;
  temperature: number;
  targetLanguage: string;
}

export interface SummaryResult {
  id: string;
  documentId: string;
  documentName: string;
  summary: string;
  keyPoints: string[];
  entities: string[];
  wordCountOriginal: number;
  wordCountSummary: number;
  chunkCount: number;
  timeTakenMs: number;
  modelUsed: string;
  providerUsed: LlmProvider;
  createdAt: string;
}

export interface GeneratedFile {
  name: string;
  language: string;
  description: string;
  content: string;
}

export interface PythonProject {
  title: string;
  description: string;
  files: GeneratedFile[];
  setupCommands: string[];
  runCommands: string[];
}

export interface OllamaModelInfo {
  name: string;
  size?: string;
  digest?: string;
  modified_at?: string;
  description?: string;
}

export interface RiskRule {
  id: string;
  variableName: string;
  description: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  thresholdValue: number | string | boolean;
  unit?: string;
  riskImpactPercent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  messageIfTriggered: string;
}

export interface ExtractedVariable {
  variableName: string;
  foundValue: number | string | boolean | null;
  rawSnippet: string;
  confidence?: number;
}

export interface RiskEvaluationResult {
  ruleId: string;
  variableName: string;
  description: string;
  expectedCondition: string;
  actualValue: number | string | boolean | null;
  triggered: boolean;
  riskImpactPercent: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export interface DocumentRiskAnalysisResult {
  documentName: string;
  totalRiskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  extractedVariables: ExtractedVariable[];
  evaluatedRules: RiskEvaluationResult[];
  aiRiskSummary: string;
}

// -------------------------------------------------------------
// EXACT SCHEMA: Structured Entities and Links for JSON Export
// -------------------------------------------------------------
export interface StructuredEntity {
  id: number;
  name: string;
  entityTypeId: number;
}

export interface StructuredLink {
  id: number;
  entityId1: number;
  linkTypeId: number;
  entityId2: number;
  strength: number;
  source: string;
}

export interface DocumentEntitiesExportJSON {
  entities: StructuredEntity[];
  links: StructuredLink[];
}

export interface EntityTypeDefinition {
  id: number;
  name: string;
  description: string;
  color: string;
}

export interface LinkTypeDefinition {
  id: number;
  name: string;
  description: string;
}

export const ENTITY_TYPE_DEFINITIONS: Record<number, EntityTypeDefinition> = {
  1: { id: 1, name: "Organization", description: "Company, institution, police department, NGO, or corporate registry", color: "#3b82f6" },
  2: { id: 2, name: "Location / Address", description: "Street address (e.g. 239 Carol Avenue), city, country, port, or facility", color: "#10b981" },
  3: { id: 3, name: "Asset / Vehicle / Property", description: "Vehicle, ship, container carrier, real estate property, or equipment", color: "#06b6d4" },
  4: { id: 4, name: "Item / Stolen Goods / Cargo", description: "Stolen property, declared goods, commodity, merchandise, or valuables", color: "#f59e0b" },
  5: { id: 5, name: "Regulation / Law / Charge", description: "Criminal statute, legal violation, regulation, ISO standard, or compliance rule", color: "#f43f5e" },
  6: { id: 6, name: "Financial Item", description: "Monetary amount, bank account, valuation, stolen value, fee, or loss", color: "#eab308" },
  7: { id: 7, name: "Person", description: "Individual, victim, suspect, witness, officer, or family member (e.g. David, Lawrence Cooper)", color: "#a855f7" },
  8: { id: 8, name: "Event / Incident / Crime", description: "Theft incident, burglary occurrence, inspection event, or transaction", color: "#ec4899" },
  9: { id: 9, name: "Metric / Date / Time", description: "Timestamp, incident date, age, draft, weight, or quantitative measurement", color: "#14b8a6" },
  10: { id: 10, name: "Technology / System / ID", description: "Badge ID, case number, software framework, model, or database", color: "#6366f1" },
  11: { id: 11, name: "Other", description: "Miscellaneous identified factual entity", color: "#64748b" },
};

export const LINK_TYPE_DEFINITIONS: Record<number, LinkTypeDefinition> = {
  1: { id: 1, name: "Affiliated / Associated With", description: "General direct affiliation, contact, or stakeholder connection" },
  2: { id: 2, name: "Familial / Kinship (Father - Son, Relative)", description: "Family or personal relationship (e.g., Father of / Son of / Spouse)" },
  3: { id: 3, name: "Incident Location (Place of Theft / Crime Scene)", description: "Location where the theft, burglary, or incident occurred" },
  4: { id: 4, name: "Located At / Resident Of / Bound For", description: "Residential address, origin, geographic presence, or destination" },
  5: { id: 5, name: "Owner / Victim / Possessor Of", description: "Ownership of property, victim of theft, or possession of asset" },
  6: { id: 6, name: "Suspect / Accused / Perpetrator", description: "Suspect in incident, perpetrator of crime, or investigated party" },
  7: { id: 7, name: "Operates / Manages / Employs", description: "Operational control, employment, navigation, or management" },
  8: { id: 8, name: "Carries / Contains / Holds", description: "Transportation, physical containment, or cargo payload" },
  9: { id: 9, name: "Regulated By / Subject To / Charged With", description: "Legal jurisdiction, statutory charge, or compliance audit" },
  10: { id: 10, name: "Measures / Quantifies / Restricts", description: "Quantitative threshold, monetary valuation, or measured parameter" },
};
