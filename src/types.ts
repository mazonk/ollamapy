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
  2: { id: 2, name: "Company", description: "Commercial enterprise, firm, or corporation", color: "#3b82f6" },
  3: { id: 3, name: "Female", description: "Female individual / woman", color: "#ec4899" },
  4: { id: 4, name: "Event", description: "Occurrence, incident, gathering, or incident event", color: "#8b5cf6" },
  5: { id: 5, name: "Gang", description: "Street gang, illicit crew, or criminal syndicate", color: "#ef4444" },
  6: { id: 6, name: "Location", description: "Geographical location, place, or landmark", color: "#14b8a6" },
  7: { id: 7, name: "Person", description: "Individual person / stakeholder / party", color: "#a855f7" },
  8: { id: 8, name: "Phone", description: "Phone number, mobile device, or telephone line", color: "#06b6d4" },
  9: { id: 9, name: "Passport", description: "Passport document, travel identification number", color: "#64748b" },
  10: { id: 10, name: "Address", description: "Street address, residence, or facility address", color: "#10b981" },
  11: { id: 11, name: "Bank Account", description: "Checking, savings, wire account number, or IBAN", color: "#eab308" },
  12: { id: 12, name: "Bank", description: "Banking institution, credit union, or financial depository", color: "#f59e0b" },
  13: { id: 13, name: "Building", description: "Commercial building, warehouse, or architectural structure", color: "#6b7280" },
  14: { id: 14, name: "Car", description: "Automobile, passenger vehicle, or truck", color: "#0284c7" },
  15: { id: 15, name: "City", description: "Metropolitan area, municipality, or city", color: "#059669" },
  16: { id: 16, name: "Country", description: "Sovereign nation or state jurisdiction", color: "#0d9488" },
  17: { id: 17, name: "Convicted Person (Currently)", description: "Individual currently serving conviction or imprisoned", color: "#dc2626" },
  18: { id: 18, name: "Convicted Person (Previously)", description: "Individual with past criminal conviction record", color: "#ea580c" },
  19: { id: 19, name: "Corporate Business Organization", description: "Registered corporate business entity or enterprise", color: "#2563eb" },
  20: { id: 20, name: "Credit Card", description: "Payment card, credit card, or card account", color: "#d97706" },
  21: { id: 21, name: "Criminal Case", description: "Prosecution docket, case number, or criminal trial", color: "#b91c1c" },
  22: { id: 22, name: "Document", description: "Official record, contract, certificate, or statement", color: "#94a3b8" },
  23: { id: 23, name: "Chemistry", description: "Chemical compound, precursor, reagent, or substance", color: "#7c3aed" },
  24: { id: 24, name: "Narcotics", description: "Illicit controlled substance, drugs, or contraband", color: "#e11d48" },
  25: { id: 25, name: "Drug Lab", description: "Clandestine synthesis laboratory or processing facility", color: "#991b1b" },
  26: { id: 26, name: "Email", description: "Electronic mail address or email account", color: "#0891b2" },
  27: { id: 27, name: "Work email", description: "Corporate or institutional work email address", color: "#0284c7" },
  28: { id: 28, name: "Events", description: "Organized events, calendar milestones, or operations", color: "#7c3aed" },
  29: { id: 29, name: "Flight", description: "Aviation flight number, scheduled air journey", color: "#0ea5e9" },
  30: { id: 30, name: "Gun", description: "Firearm, pistol, rifle, or illicit weapon", color: "#7f1d1d" },
  31: { id: 31, name: "House", description: "Residential building or dwelling", color: "#10b981" },
  32: { id: 32, name: "IP Address", description: "Internet Protocol address or network host", color: "#4f46e5" },
  33: { id: 33, name: "Male", description: "Male individual / man", color: "#3b82f6" },
  34: { id: 34, name: "Association", description: "Society, trade group, syndicate, or club", color: "#6366f1" },
  35: { id: 35, name: "Meeting", description: "Rendezvous, conference, covert meeting, or assembly", color: "#9333ea" },
  36: { id: 36, name: "Modus Operandi", description: "Pattern of criminal operation or distinctive technique", color: "#c026d3" },
  37: { id: 37, name: "Money Transfer", description: "Wire transfer, remittance, or monetary transaction", color: "#ca8a04" },
  38: { id: 38, name: "Money Laundering", description: "Illicit fund washing scheme or layering operation", color: "#a16207" },
  39: { id: 39, name: "Motorcycle", description: "Two-wheeled motor vehicle or motorbike", color: "#0369a1" },
  40: { id: 40, name: "NGO", description: "Non-governmental organization or non-profit", color: "#15803d" },
  41: { id: 41, name: "Organized Crime Group", description: "Mafia, cartel, syndicate, or organized crime ring", color: "#991b1b" },
  42: { id: 42, name: "Passport", description: "National passport credential or travel ID", color: "#64748b" },
  43: { id: 43, name: "Phone", description: "Telephone number, burner phone, or SIM card", color: "#06b6d4" },
  44: { id: 44, name: "Plane", description: "Airplane, private jet, or aircraft asset", color: "#0284c7" },
  45: { id: 45, name: "Region", description: "Province, state, county, or territorial region", color: "#0f766e" },
  46: { id: 46, name: "Ship", description: "Maritime vessel, freighter, container ship, or boat", color: "#0284c7" },
  47: { id: 47, name: "Town", description: "Township, borough, or localized populated area", color: "#047857" },
  48: { id: 48, name: "Train", description: "Railway train, locomotive, or rail transit", color: "#475569" },
  49: { id: 49, name: "Twitter Hashtag", description: "Social media hashtag topic / tag", color: "#38bdf8" },
  50: { id: 50, name: "Twitter Username", description: "Social media handle / Twitter/X profile", color: "#0284c7" },
  51: { id: 51, name: "Village", description: "Rural settlement or village location", color: "#15803d" },
  52: { id: 52, name: "Location Pin", description: "Precise GPS coordinates or geocoded pin", color: "#ef4444" },
  53: { id: 53, name: "Finance", description: "Financial asset, currency, budget, or valuation", color: "#eab308" },
};

export const LINK_TYPE_DEFINITIONS: Record<number, LinkTypeDefinition> = {
  1: { id: 1, name: "Parent-Child", description: "Parent to child kinship relationship (e.g. Father, Mother, Son, Daughter)" },
  2: { id: 2, name: "Sibling", description: "Brother, sister, or biological/adopted sibling" },
  3: { id: 3, name: "Spouse/partner", description: "Married spouse, life partner, or domestic partner" },
  4: { id: 4, name: "Grandparent-grandchild", description: "Grandparent and grandchild familial bond" },
  5: { id: 5, name: "Friend", description: "Personal social friendship or close associate" },
  6: { id: 6, name: "Colleague", description: "Professional peer or work colleague" },
  7: { id: 7, name: "Boss-employee", description: "Manager, supervisor, or executive to employee" },
  8: { id: 8, name: "Coach-player", description: "Athletic coach or mentor to team player" },
  9: { id: 9, name: "Doctor-patient", description: "Medical provider, physician, or clinician to patient" },
  10: { id: 10, name: "Business partners", description: "Commercial co-founders, joint venture partners" },
  11: { id: 11, name: "Roommates", description: "Co-habitants of shared residence or apartment" },
  12: { id: 12, name: "In-laws", description: "Familial relation by marriage" },
  13: { id: 13, name: "Employer-contractor", description: "Hiring entity to independent contractor" },
  14: { id: 14, name: "Drug supplier", description: "Supplier or distributor of narcotics to buyer/dealer" },
  15: { id: 15, name: "Informant", description: "Source providing intelligence to investigator" },
  16: { id: 16, name: "Accomplice", description: "Criminal accomplice participating in crime" },
  17: { id: 17, name: "Witness", description: "Eyewitness, reporting party, or deposition witness" },
  18: { id: 18, name: "Victim", description: "Victim of crime, theft, burglary, or fraud" },
  19: { id: 19, name: "Suspect", description: "Suspect investigated or charged for criminal act" },
  20: { id: 20, name: "Co-defendant", description: "Co-accused party in legal trial or criminal docket" },
  21: { id: 21, name: "Attorney-client", description: "Legal counsel representing client" },
  22: { id: 22, name: "Guardian-ward", description: "Legal guardian to designated ward" },
  23: { id: 23, name: "Bail bondsman-client", description: "Bail bond provider to bonded client" },
  24: { id: 24, name: "Probation officer-client", description: "Supervising probation officer to probationer" },
  25: { id: 25, name: "Foster parent-child", description: "Foster family custodial relationship" },
  26: { id: 26, name: "Caretaker-dependent", description: "Primary caregiver to dependent individual" },
  27: { id: 27, name: "Landlord-tenant", description: "Property lessor to tenant occupant" },
  28: { id: 28, name: "Step-parent", description: "Step-father or step-mother relation" },
  29: { id: 29, name: "Step-sibling", description: "Step-brother or step-sister relation" },
  30: { id: 30, name: "Step-child", description: "Step-son or step-daughter relation" },
  31: { id: 31, name: "Co-conspirator", description: "Conspiracy co-plotter in illicit enterprise" },
  32: { id: 32, name: "Ex-spouse", description: "Divorced or separated former spouse" },
  33: { id: 33, name: "Mentor-mentee", description: "Professional or academic mentorship" },
  34: { id: 34, name: "Therapist-client", description: "Psychological therapist to patient" },
  35: { id: 35, name: "Protected source", description: "Confidential investigative source under protection" },
  36: { id: 36, name: "Handler-asset", description: "Intelligence/law enforcement handler to field asset" },
  37: { id: 37, name: "Political ally", description: "Political coalition partner or supporter" },
  38: { id: 38, name: "Political opponent", description: "Political adversary or rival candidate" },
  39: { id: 39, name: "Undercover agent", description: "Covert law enforcement officer in operation" },
  40: { id: 40, name: "Surveillance target", description: "Subject under active surveillance / wiretap" },
  41: { id: 41, name: "Emergency contact", description: "Designated emergency notification contact" },
  42: { id: 42, name: "Neighbor", description: "Adjacent property resident or neighborhood occupant" },
  43: { id: 43, name: "Former colleague", description: "Previous work colleague or associate" },
  44: { id: 44, name: "Former boss", description: "Previous employer or supervisor" },
  45: { id: 45, name: "Former employee", description: "Prior subordinate or worker" },
  46: { id: 46, name: "Rival gang member", description: "Member of opposing gang or hostile syndicate" },
  47: { id: 47, name: "Co-defendant's family", description: "Kin or family member of co-defendant" },
  48: { id: 48, name: "Key witness", description: "Primary factual witness in investigation" },
  49: { id: 49, name: "Confidential informant", description: "Registered confidential police informant" },
  50: { id: 50, name: "Legal guardian", description: "Appointed legal guardian" },
  51: { id: 51, name: "Adoptive parent", description: "Adoptive mother or father" },
  52: { id: 52, name: "Adoptive child", description: "Adopted son or daughter" },
  53: { id: 53, name: "Foster sibling", description: "Sibling in foster care arrangement" },
  54: { id: 54, name: "Ex-roommate", description: "Previous co-habitant or flatmate" },
  55: { id: 55, name: "Beneficiary", description: "Designated recipient of trust, estate, or insurance" },
  56: { id: 56, name: "Trustee", description: "Fiduciary manager of trust or funds" },
  57: { id: 57, name: "Power of attorney", description: "Authorized legal decision-maker under POA" },
  58: { id: 58, name: "Executor of estate", description: "Appointed administrator of deceased estate" },
  59: { id: 59, name: "Parole officer", description: "State parole supervisor" },
  60: { id: 60, name: "Community service supervisor", description: "Supervisor for court-mandated community labor" },
  61: { id: 61, name: "Military superior", description: "Commanding officer or military superior rank" },
  62: { id: 62, name: "Military subordinate", description: "Subordinate enlisted member or soldier" },
  63: { id: 63, name: "Gang leader", description: "Ring leader, boss, or kingpin of gang" },
  64: { id: 64, name: "Gang recruit", description: "Initiate or newly recruited gang affiliate" },
  65: { id: 65, name: "Union representative", description: "Organized labor steward or union delegate" },
  66: { id: 66, name: "Union member", description: "Rank-and-file trade union member" },
  67: { id: 67, name: "Arbitrator", description: "Appointed binding dispute arbitrator" },
  68: { id: 68, name: "Mediator", description: "Independent dispute resolution mediator" },
  69: { id: 69, name: "Crisis negotiator", description: "Hostage or tactical crisis negotiator" },
  70: { id: 70, name: "Hostage", description: "Abducted or held captive individual" },
  71: { id: 71, name: "Kidnapper", description: "Abductor or perpetrator of hostage-taking" },
  72: { id: 72, name: "Smuggler", description: "Illicit transporter of contraband or goods" },
  73: { id: 73, name: "Human trafficker", description: "Perpetrator of illicit human trafficking" },
  74: { id: 74, name: "Organized crime member", description: "Indicted or identified member of syndicate" },
  75: { id: 75, name: "Counterfeit goods dealer", description: "Distributor of fraudulent or counterfeit goods" },
  76: { id: 76, name: "Illegal arms dealer", description: "Trafficker of illicit weapons or firearms" },
  77: { id: 77, name: "Intellectual property thief", description: "Perpetrator of corporate espionage or IP theft" },
  78: { id: 78, name: "Cybercriminal", description: "Operator of digital crime, ransomware, or fraud" },
  79: { id: 79, name: "Hacker", description: "Unauthorized computer network penetrator" },
  80: { id: 80, name: "Identity thief", description: "Fraudulent user of stolen personal credentials" },
  81: { id: 81, name: "Counter-surveillance operator", description: "Operator detecting or evading security surveillance" },
  82: { id: 82, name: "Escape driver", description: "Getaway driver or transport operative for crime" },
  83: { id: 83, name: "Money launderer", description: "Financial intermediary concealing illicit funds" },
};
