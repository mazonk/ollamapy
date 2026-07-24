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
