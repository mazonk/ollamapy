import { DocumentFile } from "../types";

export const SAMPLE_DOCUMENTS: DocumentFile[] = [
  {
    id: "incident-report-theft-1",
    name: "Police_Incident_Report_Theft_Investigation_Carol_Ave.txt",
    size: 9400,
    type: "txt",
    wordCount: 850,
    createdAt: new Date().toISOString(),
    text: `POLICE DEPARTMENT INCIDENT & INVESTIGATION REPORT
Case File: CR-2026-08819
Incident Type: Residential Burglary & Grand Theft
Date of Incident: August 14, 2026
Reported Location (Place of Theft): 239 Carol Avenue, Springfield

1. INCIDENT SUMMARY
On August 14, 2026, officers responded to a reported residential burglary and grand theft at 239 Carol Avenue. The property is the primary residence of Lawrence Cooper. The theft occurred between 14:00 and 17:30 hours while the residence was unoccupied.

2. INVOLVED INDIVIDUALS & PERSONS
- Victim / Property Owner: Lawrence Cooper (Age 58, Resident of 239 Carol Avenue)
- Reporting Party & Son: David Cooper (David, Age 26, son of Lawrence Cooper)
- Investigating Officer: Detective Marcus Vance (Badge #4092, Metro Police Department)

3. WITNESS STATEMENTS & KINSHIP
David confirmed that he is the son of Lawrence Cooper. David arrived at 239 Carol Avenue at approximately 17:45 to check on the residence and discovered the rear sliding door forced open. Lawrence Cooper was contacted and confirmed that several high-value family heirlooms and electronics were missing from the master bedroom.

4. STOLEN PROPERTY & VALUATION
- Stolen Items: Vintage Gold Rolex Watch, Diamond Pendant, and Apple MacBook Pro
- Estimated Stolen Value: $14,500 USD
- Point of Entry: Forced rear patio glass door at 239 Carol Avenue

5. CURRENT INVESTIGATIVE STATUS
Physical evidence collected at 239 Carol Avenue (scene of theft) has been logged into evidence lockup. Detective Marcus Vance is reviewing neighborhood security camera footage.`,
  },
  {
    id: "vessel-manifest-1",
    name: "MV_Atlantic_Carrier_Vessel_Inspection_Manifest.txt",
    size: 16800,
    type: "txt",
    wordCount: 1920,
    createdAt: new Date().toISOString(),
    text: `MARITIME SAFETY, CARGO & VESSEL INSPECTION MANIFEST
Official Document ID: MAR-2026-V88912
Issue Date: July 22, 2026
Port of Origin: Rotterdam, Netherlands
Destination: Port of Singapore

1. GENERAL SHIP PARTICULARS
- Vessel Name: MV Atlantic Carrier
- IMO Number: IMO 9482710
- Flag State Registry: Panama
- Vessel Type: Multi-purpose Container & Heavy Cargo Vessel
- Year Built: 2002
- Calculated Vessel Age: 24 years

2. CARGO SPECIFICATIONS & WEIGHT TONNAGE
- Primary Commodity: Heavy Industrial Machinery & Chemical Storage Drums
- Total Declared Cargo Load: 34,500 kg (34.5 metric tons)
- Maximum Rated Safe Cargo Weight: 30,000 kg
- Overweight Status: Exceeds safe threshold by 4,500 kg
- Hazardous Goods Designation: YES - Contains Class 3 Flammable Liquid (UN 1203 Motor Spirit, 3,200 Liters)

3. NAVIGATIONAL DRAFT & STABILITY
- Measured Draft Depth: 12.8 meters
- Maximum Port Channel Depth Allowance: 11.5 meters
- Ballast Tank Condition: Sub-optimal balance on Port side

4. CERTIFICATION & SAFETY AUDIT LOGS
- Last Drydock Hull Inspection: May 10, 2024
- Mandatory Inspection Overdue Status: Overdue by 52 days
- Active Crew Manning: 14 officers and sailors
- Minimum Safe Crew Requirement: 16 crew members
- Onboard Fire Suppression System: Certified functional (Renewal due Nov 2026)
- Total Marine Insurance Valuation: $18,200,000 USD`,
  },
  {
    id: "sample-1",
    name: "Artificial_Intelligence_Enterprise_Report_2026.txt",

    size: 14200,
    type: "txt",
    wordCount: 1850,
    createdAt: new Date().toISOString(),
    text: `EXECUTIVE SUMMARY: ENTERPRISE AI & LOCAL LLM ADOPTION REPORT 2026

1. Overview
The enterprise technology landscape in 2026 is witnessing an unprecedented shift toward local and hybrid Large Language Model (LLM) deployments. Driven by stringent data privacy regulations, cost optimization, and reduced cloud latency, over 68% of Fortune 500 organizations have integrated edge or on-premise AI models like Ollama, Llama 3.2, Mistral, and DeepSeek into their core operations.

2. Key Strategic Drivers
- Data Sovereignty & Security: Organizations in financial services, healthcare, and defence cannot expose sensitive customer data, IP, or health records to third-party public API endpoints. Running models locally via Ollama ensures complete data air-gapping.
- Cost Efficiency at Scale: High-volume document summarization, code auditing, and internal search pipelines incur massive token fees on commercial API clouds. Local LLMs on workstation GPUs eliminate recurring API costs.
- Reduced Latency: Edge inferencing on local Apple Silicon M-series chips or Nvidia RTX GPUs delivers instant sub-second response times for document retrieval (RAG) and automated summarization.

3. Document Summarization Architecture
Effective local document summarization relies on a chunking and map-reduce architecture:
- Text Extraction: Converting heterogenous formats (PDF, DOCX, Markdown, OCR scans) into clean UTF-8 text streams.
- Context Window Management: Breaking long manuscripts into 2,000 to 4,000 token sliding windows with a 10-15% overlap to preserve cross-section context.
- Sectional Map Phase: Summarizing each chunk independently with strict prompt constraints.
- Final Reduce Phase: Synthesizing section summaries into an executive briefing featuring main themes, risks, and actionable recommendations.

4. Implementation Challenges
- Model Context Window Limits: Smaller localized models (e.g., 3B to 8B parameter models) require careful context formatting to prevent hallucination or key detail truncation.
- Hardware RAM Limits: Running 14B or 70B quantized models requires 16GB to 64GB Unified RAM or dedicated VRAM.
- Quantization Trade-offs: Q4_K_M and Q8_0 quantizations offer optimum balance between speed and factual accuracy.

5. Recommendations
- Implement Ollama as the standardized local daemon across developer machines.
- Use Python scripts utilizing Streamlit or LangChain to automate multi-file processing pipelines.
- Standardize on open models: Llama 3.2 for general synthesis, DeepSeek R1 for reasoning, and Mistral 7B for fast technical analysis.`,
  },
  {
    id: "sample-2",
    name: "Q2_2026_Product_Roadmap_&_Engineering_Sync.md",
    size: 9800,
    type: "md",
    wordCount: 1240,
    createdAt: new Date().toISOString(),
    text: `# Q2 2026 Product & Engineering Roadmap

## Project Alpha: Next-Gen Document Intelligence Engine

### Objective
Build a privacy-first, local-first document processing pipeline capable of processing 10,000+ page documents with sub-second retrieval times.

---

### Sprint 1 & 2: Core Ingestion Pipeline
- **Deliverable 1.1**: Multi-format document parser supporting PDF, DOCX, XLSX, and Markdown.
- **Deliverable 1.2**: Semantic chunking engine with configurable token overlap and header preservation.
- **Deliverable 1.3**: Direct integration with Ollama REST API (\`http://localhost:11434\`) supporting streaming output.

### Sprint 3 & 4: Model Evaluation & Benchmarks
- **Llama 3.2 3B / 8B**: Selected for default fast document summaries (average 42 tokens/sec on Apple M3 Pro).
- **DeepSeek R1 Distill**: Selected for complex contract analysis and logic verification.
- **Mistral 7B**: Selected for multi-language translation and markdown table structuring.

### Key Risks & Mitigation
1. **Risk**: PDF layout corruption (multi-column text merging).
   - *Mitigation*: Integrate \`pdfplumber\` and layout-aware OCR engines.
2. **Risk**: Memory leaks during multi-file batch summarization.
   - *Mitigation*: Implement garbage collection hooks between chunk iterations in Python backend.

### Next Steps & Action Items
- [ ] @Alex: Benchmark PyPDF vs pdfplumber parsing speeds on 500-page medical reports.
- [ ] @Sarah: Finish Streamlit UI frontend for document drag-and-drop.
- [ ] @David: Release Docker container packaging Ollama + Python runtime.`,
  },
  {
    id: "sample-3",
    name: "Master_Services_Agreement_Draft.txt",
    size: 11500,
    type: "txt",
    wordCount: 1520,
    createdAt: new Date().toISOString(),
    text: `MASTER SERVICES AGREEMENT (MSA) - CONFIDENTIAL

THIS AGREEMENT is entered into on July 15, 2026, by and between Nexus Tech Solutions LLC ("Provider") and Global Enterprise Corp ("Client").

1. SCOPE OF SERVICES
Provider agrees to deliver AI Consulting, Custom Local LLM Model Optimization, and Software Integration Services as specified in individual Statements of Work (SOW) executed pursuant to this Agreement.

2. INTELLECTUAL PROPERTY & DATA PRIVACY
2.1 Client Ownership: All Client Data, uploaded documents, processed text, proprietary datasets, and model fine-tuning weights derived from Client Data shall remain the sole property of Client.
2.2 Air-Gapped Local Processing: Provider warrants that all document processing, text parsing, and AI summarization shall take place on Client-controlled local hardware using local Ollama container instances. No Client Data shall be transmitted to external third-party cloud AI vendors without prior written consent from Client's Chief Information Security Officer (CISO).

3. FEES & PAYMENT TERMS
3.1 Fixed Fee SOWs: Client agrees to pay Provider within 30 days of receipt of invoice.
3.2 Late Charges: Invoices unpaid after 30 days shall accrue interest at 1.5% per month or the maximum allowable rate under governing law.

4. TERM & TERMINATION
4.1 Term: This Agreement shall commence on the Effective Date and continue for a period of twelve (12) months.
4.2 Termination for Convenience: Either party may terminate this Agreement without cause by providing thirty (30) days advance written notice.

5. INDEMNIFICATION & LIABILITY
5.1 Limitation of Liability: Neither party's total aggregate liability arising under this Agreement shall exceed the total fees paid by Client to Provider in the six (6) months preceding the claim.
5.2 Exceptions: The limitation of liability shall not apply to breaches of confidentiality (Section 6) or gross negligence.`,
  }
];
