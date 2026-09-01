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

export interface EntityTypeItem {
  id: number;
  name: string;
}

export interface LinkTypeItem {
  id: number;
  name: string;
}

export interface StructuredAttribute {
  id: number;
  entityId: number;
  name: string;
  value: string;
  author: string;
  date: string;
}

export interface DocumentEntitiesExportJSON {
  entities: StructuredEntity[];
  links: StructuredLink[];
  entityTypes?: EntityTypeItem[];
  linkTypes?: LinkTypeItem[];
  attributes?: StructuredAttribute[];
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
  1: { id: 1, name: "House", description: "Residential house or home property", color: "#10b981" },
  2: { id: 2, name: "company", description: "Commercial enterprise, firm, or corporation", color: "#3b82f6" },
  3: { id: 3, name: "female", description: "Female individual / woman", color: "#ec4899" },
  4: { id: 4, name: "event", description: "Occurrence, incident, gathering, or incident event", color: "#8b5cf6" },
  5: { id: 5, name: "gang", description: "Street gang, illicit crew, or criminal syndicate", color: "#ef4444" },
  6: { id: 6, name: "streetname", description: "Street name, thoroughfare, or roadway", color: "#14b8a6" },
  7: { id: 7, name: "person", description: "Individual person / stakeholder / party", color: "#a855f7" },
  8: { id: 8, name: "phone", description: "Phone number, mobile device, or telephone line", color: "#06b6d4" },
  9: { id: 9, name: "passport", description: "Passport document, travel identification number", color: "#64748b" },
  10: { id: 10, name: "address", description: "Street address, residence, or facility address", color: "#10b981" },
  11: { id: 11, name: "bank_account", description: "Checking, savings, wire account number, or IBAN", color: "#eab308" },
  12: { id: 12, name: "bank", description: "Banking institution, credit union, or financial depository", color: "#f59e0b" },
  13: { id: 13, name: "building", description: "Commercial building, warehouse, or architectural structure", color: "#6b7280" },
  14: { id: 14, name: "car", description: "Automobile, passenger vehicle, or truck", color: "#0284c7" },
  15: { id: 15, name: "city", description: "Metropolitan area, municipality, or city", color: "#059669" },
  16: { id: 16, name: "country", description: "Sovereign nation or state jurisdiction", color: "#0d9488" },
  17: { id: 17, name: "convicted_person_current", description: "Individual currently serving conviction or imprisoned", color: "#dc2626" },
  18: { id: 18, name: "convicted_person_prev", description: "Individual with past criminal conviction record", color: "#ea580c" },
  19: { id: 19, name: "corporate_business", description: "Registered corporate business entity or enterprise", color: "#2563eb" },
  20: { id: 20, name: "credit_card", description: "Payment card, credit card, or card account", color: "#d97706" },
  21: { id: 21, name: "criminal_case", description: "Prosecution docket, case number, or criminal trial", color: "#b91c1c" },
  22: { id: 22, name: "document", description: "Official record, contract, certificate, or statement", color: "#94a3b8" },
  23: { id: 23, name: "chemistry", description: "Chemical compound, precursor, reagent, or substance", color: "#7c3aed" },
  24: { id: 24, name: "narcotics", description: "Illicit controlled substance, drugs, or contraband", color: "#e11d48" },
  25: { id: 25, name: "drug_lab", description: "Clandestine synthesis laboratory or processing facility", color: "#991b1b" },
  26: { id: 26, name: "email", description: "Electronic mail address or email account", color: "#0891b2" },
  27: { id: 27, name: "work_email", description: "Corporate or institutional work email address", color: "#0284c7" },
  28: { id: 28, name: "events", description: "Organized events, calendar milestones, or operations", color: "#7c3aed" },
  29: { id: 29, name: "flight", description: "Aviation flight number, scheduled air journey", color: "#0ea5e9" },
  30: { id: 30, name: "gun", description: "Firearm, pistol, rifle, or illicit weapon", color: "#7f1d1d" },
  31: { id: 31, name: "house", description: "Residential building or dwelling", color: "#10b981" },
  32: { id: 32, name: "ip_address", description: "Internet Protocol address or network host", color: "#4f46e5" },
  33: { id: 33, name: "male", description: "Male individual / man", color: "#3b82f6" },
  34: { id: 34, name: "association", description: "Society, trade group, syndicate, or club", color: "#6366f1" },
  35: { id: 35, name: "meeting", description: "Rendezvous, conference, covert meeting, or assembly", color: "#9333ea" },
  36: { id: 36, name: "modus_operandi", description: "Pattern of criminal operation or distinctive technique", color: "#c026d3" },
  37: { id: 37, name: "money_transfer", description: "Wire transfer, remittance, or monetary transaction", color: "#ca8a04" },
  38: { id: 38, name: "money_laundering", description: "Illicit fund washing scheme or layering operation", color: "#a16207" },
  39: { id: 39, name: "motorcycle", description: "Two-wheeled motor vehicle or motorbike", color: "#0369a1" },
  40: { id: 40, name: "ngo", description: "Non-governmental organization or non-profit", color: "#15803d" },
  41: { id: 41, name: "organized_crime_group", description: "Mafia, cartel, syndicate, or organized crime ring", color: "#991b1b" },
  42: { id: 42, name: "passport", description: "National passport credential or travel ID", color: "#64748b" },
  43: { id: 43, name: "phone", description: "Telephone number, burner phone, or SIM card", color: "#06b6d4" },
  44: { id: 44, name: "plane", description: "Airplane, private jet, or aircraft asset", color: "#0284c7" },
  45: { id: 45, name: "region", description: "Province, state, county, or territorial region", color: "#0f766e" },
  46: { id: 46, name: "ship", description: "Maritime vessel, freighter, container ship, or boat", color: "#0284c7" },
  47: { id: 47, name: "town", description: "Township, borough, or localized populated area", color: "#047857" },
  48: { id: 48, name: "train", description: "Railway train, locomotive, or rail transit", color: "#475569" },
  49: { id: 49, name: "twitter_hashtag", description: "Social media hashtag topic / tag", color: "#38bdf8" },
  50: { id: 50, name: "twitter_username", description: "Social media handle / Twitter/X profile", color: "#0284c7" },
  51: { id: 51, name: "village", description: "Rural settlement or village location", color: "#15803d" },
  52: { id: 52, name: "location_pin", description: "Precise GPS coordinates or geocoded pin", color: "#ef4444" },
  53: { id: 53, name: "finance", description: "Financial asset, currency, budget, or valuation", color: "#eab308" },
};

export const LINK_TYPE_DEFINITIONS: Record<number, LinkTypeDefinition> = {
  1: { id: 1, name: "address", description: "Address, residence, or property location link" },
  2: { id: 2, name: "employee", description: "Employee, staff member, or corporate affiliation" },
  3: { id: 3, name: "family", description: "Family member, parent-child, sibling, or relative" },
  4: { id: 4, name: "friend", description: "Personal social friendship or close associate" },
  5: { id: 5, name: "colleague", description: "Professional peer or work colleague" },
  6: { id: 6, name: "boss-employee", description: "Manager, supervisor, or executive to employee" },
  7: { id: 7, name: "business-partner", description: "Commercial co-founders, joint venture partners" },
  8: { id: 8, name: "spouse-partner", description: "Married spouse, life partner, or domestic partner" },
  9: { id: 9, name: "parent-child", description: "Parent to child kinship relationship" },
  10: { id: 10, name: "sibling", description: "Brother, sister, or biological/adopted sibling" },
  11: { id: 11, name: "roommates", description: "Co-habitants of shared residence or apartment" },
  12: { id: 12, name: "in-laws", description: "Familial relation by marriage" },
  13: { id: 13, name: "employer-contractor", description: "Hiring entity to independent contractor" },
  14: { id: 14, name: "drug-supplier", description: "Supplier or distributor of narcotics to buyer/dealer" },
  15: { id: 15, name: "informant", description: "Source providing intelligence to investigator" },
  16: { id: 16, name: "accomplice", description: "Criminal accomplice participating in crime" },
  17: { id: 17, name: "witness", description: "Eyewitness, reporting party, or deposition witness" },
  18: { id: 18, name: "victim", description: "Victim of crime, theft, burglary, or fraud" },
  19: { id: 19, name: "suspect", description: "Suspect investigated or charged for criminal act" },
  20: { id: 20, name: "co-defendant", description: "Co-accused party in legal trial or criminal docket" },
  21: { id: 21, name: "attorney-client", description: "Legal counsel representing client" },
  22: { id: 22, name: "guardian-ward", description: "Legal guardian to designated ward" },
  23: { id: 23, name: "bail-bondsman-client", description: "Bail bond provider to bonded client" },
  24: { id: 24, name: "probation-officer-client", description: "Supervising probation officer to probationer" },
  25: { id: 25, name: "foster-parent-child", description: "Foster family custodial relationship" },
  26: { id: 26, name: "caretaker-dependent", description: "Primary caregiver to dependent individual" },
  27: { id: 27, name: "landlord-tenant", description: "Property lessor to tenant occupant" },
  28: { id: 28, name: "step-parent", description: "Step-father or step-mother relation" },
  29: { id: 29, name: "step-sibling", description: "Step-brother or step-sister relation" },
  30: { id: 30, name: "step-child", description: "Step-son or step-daughter relation" },
  31: { id: 31, name: "co-conspirator", description: "Conspiracy co-plotter in illicit enterprise" },
  32: { id: 32, name: "ex-spouse", description: "Divorced or separated former spouse" },
  33: { id: 33, name: "mentor-mentee", description: "Professional or academic mentorship" },
  34: { id: 34, name: "therapist-client", description: "Psychological therapist to patient" },
  35: { id: 35, name: "protected-source", description: "Confidential investigative source under protection" },
  36: { id: 36, name: "handler-asset", description: "Intelligence/law enforcement handler to field asset" },
  37: { id: 37, name: "political-ally", description: "Political coalition partner or supporter" },
  38: { id: 38, name: "political-opponent", description: "Political adversary or rival candidate" },
  39: { id: 39, name: "undercover-agent", description: "Covert law enforcement officer in operation" },
  40: { id: 40, name: "surveillance-target", description: "Subject under active surveillance / wiretap" },
  41: { id: 41, name: "emergency-contact", description: "Designated emergency notification contact" },
  42: { id: 42, name: "neighbor", description: "Adjacent property resident or neighborhood occupant" },
  43: { id: 43, name: "former-colleague", description: "Previous work colleague or associate" },
  44: { id: 44, name: "former-boss", description: "Previous employer or supervisor" },
  45: { id: 45, name: "former-employee", description: "Prior subordinate or worker" },
  46: { id: 46, name: "rival-gang-member", description: "Member of opposing gang or hostile syndicate" },
  47: { id: 47, name: "co-defendants-family", description: "Kin or family member of co-defendant" },
  48: { id: 48, name: "key-witness", description: "Primary factual witness in investigation" },
  49: { id: 49, name: "confidential-informant", description: "Registered confidential police informant" },
  50: { id: 50, name: "legal-guardian", description: "Appointed legal guardian" },
  51: { id: 51, name: "adoptive-parent", description: "Adoptive mother or father" },
  52: { id: 52, name: "adoptive-child", description: "Adopted son or daughter" },
  53: { id: 53, name: "foster-sibling", description: "Sibling in foster care arrangement" },
  54: { id: 54, name: "ex-roommate", description: "Previous co-habitant or flatmate" },
  55: { id: 55, name: "beneficiary", description: "Designated recipient of trust, estate, or insurance" },
  56: { id: 56, name: "trustee", description: "Fiduciary manager of trust or funds" },
  57: { id: 57, name: "power-of-attorney", description: "Authorized legal decision-maker under POA" },
  58: { id: 58, name: "executor-of-estate", description: "Appointed administrator of deceased estate" },
  59: { id: 59, name: "parole-officer", description: "State parole supervisor" },
  60: { id: 60, name: "community-service-supervisor", description: "Supervisor for court-mandated community labor" },
  61: { id: 61, name: "military-superior", description: "Commanding officer or military superior rank" },
  62: { id: 62, name: "military-subordinate", description: "Subordinate enlisted member or soldier" },
  63: { id: 63, name: "gang-leader", description: "Ring leader, boss, or kingpin of gang" },
  64: { id: 64, name: "gang-recruit", description: "Initiate or newly recruited gang affiliate" },
  65: { id: 65, name: "union-representative", description: "Organized labor steward or union delegate" },
  66: { id: 66, name: "union-member", description: "Rank-and-file trade union member" },
  67: { id: 67, name: "arbitrator", description: "Appointed binding dispute arbitrator" },
  68: { id: 68, name: "mediator", description: "Independent dispute resolution mediator" },
  69: { id: 69, name: "crisis-negotiator", description: "Hostage or tactical crisis negotiator" },
  70: { id: 70, name: "hostage", description: "Abducted or held captive individual" },
  71: { id: 71, name: "kidnapper", description: "Abductor or perpetrator of hostage-taking" },
  72: { id: 72, name: "smuggler", description: "Illicit transporter of contraband or goods" },
  73: { id: 73, name: "human-trafficker", description: "Perpetrator of illicit human trafficking" },
  74: { id: 74, name: "organized-crime-member", description: "Indicted or identified member of syndicate" },
  75: { id: 75, name: "counterfeit-goods-dealer", description: "Distributor of fraudulent or counterfeit goods" },
  76: { id: 76, name: "illegal-arms-dealer", description: "Trafficker of illicit weapons or firearms" },
  77: { id: 77, name: "intellectual-property-thief", description: "Perpetrator of corporate espionage or IP theft" },
  78: { id: 78, name: "cybercriminal", description: "Operator of digital crime, ransomware, or fraud" },
  79: { id: 79, name: "hacker", description: "Unauthorized computer network penetrator" },
  80: { id: 80, name: "identity-thief", description: "Fraudulent user of stolen personal credentials" },
  81: { id: 81, name: "counter-surveillance-operator", description: "Operator detecting or evading security surveillance" },
  82: { id: 82, name: "escape-driver", description: "Getaway driver or transport operative for crime" },
  83: { id: 83, name: "money-launderer", description: "Financial intermediary concealing illicit funds" },
};
