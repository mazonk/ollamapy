import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Helper to get Gemini client lazily
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. Health Endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Check Ollama Local Connection
app.post("/api/ollama/check", async (req, res) => {
  const { host = "http://localhost:11434" } = req.body;
  const targetUrl = host.replace(/\/$/, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${targetUrl}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      res.json({
        online: true,
        models: data.models || [],
        host: targetUrl,
      });
    } else {
      res.json({
        online: false,
        error: `Ollama host returned status ${response.status}`,
        host: targetUrl,
      });
    }
  } catch (err: any) {
    res.json({
      online: false,
      error: err.message || "Failed to reach local Ollama instance",
      host: targetUrl,
    });
  }
});

// 3. Proxy Generate Call to Ollama Host
app.post("/api/ollama/generate", async (req, res) => {
  const { host = "http://localhost:11434", model = "llama3.2", prompt, system, options } = req.body;
  const targetUrl = host.replace(/\/$/, "");

  try {
    const response = await fetch(`${targetUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        system,
        options,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText || "Ollama generation failed" });
    }

    const data = await response.json();
    res.json({
      response: data.response,
      total_duration: data.total_duration,
      eval_count: data.eval_count,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Could not connect to Ollama server." });
  }
});

// 4. Gemini Server-Side Summarize Endpoint
app.post("/api/gemini/summarize", async (req, res) => {
  try {
    const {
      text,
      documentName = "Document",
      mode = "executive",
      customPrompt = "",
      targetLanguage = "English",
      chunkSize = 3000,
      temperature = 0.3,
    } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Document text is required." });
    }

    const ai = getGeminiClient();

    let modePrompt = "";
    switch (mode) {
      case "executive":
        modePrompt = "Provide an Executive Summary with a high-level summary overview, key findings, strategic implications, and conclusions.";
        break;
      case "bullets":
        modePrompt = "Provide a comprehensive Bullet-Point Summary organized by key topics and main points.";
        break;
      case "key_takeaways":
        modePrompt = "Provide the top Key Takeaways, core arguments, critical data points, and actionable knowledge.";
        break;
      case "action_items":
        modePrompt = "Extract all Action Items, Next Steps, Recommendations, Decisions, and Assigned Responsibilities if present.";
        break;
      case "technical":
        modePrompt = "Provide an In-Depth Technical Analysis, detailing methodologies, specifications, data/results, edge cases, and architectures.";
        break;
      case "custom":
        modePrompt = customPrompt || "Summarize the document clearly and thoroughly.";
        break;
      default:
        modePrompt = "Summarize the document clearly and concisely.";
    }

    const systemInstruction = `You are an expert AI Document Summarizer powered by Large Language Models.
Your task is to analyze the user's uploaded document ("${documentName}") and produce a clear, high-quality, structured summary in ${targetLanguage}.

Required Output Structure in JSON format:
{
  "summary": "Full markdown-formatted summary adhering to requested style",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", ...],
  "entities": ["Topic/Entity 1", "Topic/Entity 2", ...]
}

Format guidelines for "summary":
- Use Markdown formatting (headers, bold text, bullet points).
- Keep it accurate to the source text.
- Target language: ${targetLanguage}.`;

    const userPrompt = `Document Name: ${documentName}
Summarization Style: ${modePrompt}

Document Text:
${text.slice(0, 80000)} ${text.length > 80000 ? "\n\n[Text truncated for processing length limit]" : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature,
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      parsed = {
        summary: response.text || "Summary generated successfully.",
        keyPoints: [],
        entities: [],
      };
    }

    res.json({
      summary: parsed.summary || "No summary output.",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      wordCountOriginal: text.trim().split(/\s+/).length,
      wordCountSummary: (parsed.summary || "").trim().split(/\s+/).length,
      chunkCount: Math.ceil(text.length / (chunkSize * 4)),
      modelUsed: "gemini-3.7-flash",
      providerUsed: "gemini",
    });
  } catch (err: any) {
    console.error("Gemini summarize error:", err);
    res.status(500).json({ error: err.message || "Failed to generate summary with Gemini." });
  }
});

// 4b. AI Agent Entity & Link Extraction Endpoint (Strict Schema JSON Export)
app.post("/api/entities/extract", async (req, res) => {
  try {
    const { text, documentName = "Document", documentId = "doc-1" } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ error: "Document text is required." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a precision AI Document Entity & Relationship Knowledge Extraction Engine.
MANDATORY DIRECTIVES:
1. You MUST read the entire provided document text thoroughly and completely from start to finish.
2. DO NOT make up things, fabricate, assume, or hallucinate entities or relationships.
3. Be strictly precise. Only extract real-world entities directly substantiated by explicit factual evidence in the text.
4. CRITICAL: DO NOT treat the document or report itself as an entity. NEVER output "Report", "Document", "File", "Incident Report", or the document title as an entity. Extract only granular, real-world named entities: individual people (e.g., "David", "Lawrence Cooper"), specific addresses/locations (e.g., "Spangsbjerg Møllevej 14A", "239 Carol Avenue"), specific incidents (e.g., "Theft Incident"), stolen items/assets, organizations, etc.
5. Automatically assign sequential positive integer IDs starting from 1 (1, 2, 3...) for all entities and links.
6. Map entity types to the integer entityTypeId:
   1: house, 2: company, 3: female, 4: event, 5: gang, 6: streetname, 7: person, 8: phone, 9: passport, 10: address,
   11: bank_account, 12: bank, 13: building, 14: car, 15: city, 16: country, 17: convicted_person_current, 18: convicted_person_prev, 19: corporate_business, 20: credit_card,
   21: criminal_case, 22: document, 23: chemistry, 24: narcotics, 25: drug_lab, 26: email, 27: work_email, 28: events, 29: flight, 30: gun,
   31: house, 32: ip_address, 33: male, 34: association, 35: meeting, 36: modus_operandi, 37: money_transfer, 38: money_laundering, 39: motorcycle, 40: ngo,
   41: organized_crime_group, 42: passport, 43: phone, 44: plane, 45: region, 46: ship, 47: town, 48: train, 49: twitter_hashtag, 50: twitter_username,
   51: village, 52: location_pin, 53: finance
7. Map link types to the integer linkTypeId:
   1: address, 2: employee, 3: family, 4: friend, 5: colleague, 6: boss-employee, 7: business-partner, 8: spouse-partner, 9: parent-child, 10: sibling,
   11: roommates, 12: in-laws, 13: employer-contractor, 14: drug-supplier, 15: informant, 16: accomplice, 17: witness, 18: victim, 19: suspect, 20: co-defendant,
   21: attorney-client, 22: guardian-ward, 23: bail-bondsman-client, 24: probation-officer-client, 25: foster-parent-child, 26: caretaker-dependent, 27: landlord-tenant, 28: step-parent, 29: step-sibling, 30: step-child,
   31: co-conspirator, 32: ex-spouse, 33: mentor-mentee, 34: therapist-client, 35: protected-source, 36: handler-asset, 37: political-ally, 38: political-opponent, 39: undercover-agent, 40: surveillance-target,
   41: emergency-contact, 42: neighbor, 43: former-colleague, 44: former-boss, 45: former-employee, 46: rival-gang-member, 47: co-defendants-family, 48: key-witness, 49: confidential-informant, 50: legal-guardian
8. Each link must have:
   - "id": sequential integer (1, 2, 3...)
   - "entityId1": integer referencing entities[].id
   - "linkTypeId": integer linkTypeId
   - "entityId2": integer referencing entities[].id
   - "strength": float between 0.1 and 1.0 (confidence or connection weight)
   - "source": string citation or document name indicating where in the document this connection is verified.

9. At the end of the JSON object, directly after links, include:
   - "entityTypes": list of entity types referenced in this case starting with {"id": -1, "name": "semantic_group"} followed by the entity types present in the entities array (e.g. {"id": 7, "name": "person"}, {"id": 6, "name": "streetname"}, {"id": 2, "name": "company"})
   - "linkTypes": list of link types referenced in this case starting with {"id": -1, "name": "semantic_link"} followed by the link types present in the links array (e.g. {"id": 1, "name": "address"}, {"id": 2, "name": "employee"}, {"id": 3, "name": "family"})
   - "attributes": array of granular attributes extracted for the entities in the case (optional):
     {
       "id": integer sequential,
       "entityId": integer referencing entities[].id,
       "name": attribute name (e.g. "Address", "Alias", "Phone", "Car", "Public figure", "Valuation", "Role", "Note"),
       "value": factual attribute value from document,
       "author": "AdamLorincz",
       "date": ISO-8601 timestamp (e.g. "2023-06-23T15:00:28.708")
     }

OUTPUT STRICTLY VALID JSON MATCHING THIS EXACT SCHEMA:
{
  "entities": [
    {
      "id": 1,
      "name": "Lawrence Cooper",
      "entityTypeId": 7
    },
    {
      "id": 2,
      "name": "David",
      "entityTypeId": 7
    },
    {
      "id": 3,
      "name": "Spangsbjerg Møllevej 14A",
      "entityTypeId": 6
    },
    {
      "id": 4,
      "name": "Acme Logistics Corp",
      "entityTypeId": 2
    }
  ],
  "links": [
    {
      "id": 1,
      "entityId1": 1,
      "linkTypeId": 1,
      "entityId2": 3,
      "strength": 0.95,
      "source": "${documentName}"
    },
    {
      "id": 2,
      "entityId1": 2,
      "linkTypeId": 2,
      "entityId2": 4,
      "strength": 0.90,
      "source": "${documentName}"
    }
  ],
  "entityTypes": [
    {
      "id": -1,
      "name": "semantic_group"
    },
    {
      "id": 7,
      "name": "person"
    },
    {
      "id": 6,
      "name": "streetname"
    },
    {
      "id": 2,
      "name": "company"
    }
  ],
  "linkTypes": [
    {
      "id": -1,
      "name": "semantic_link"
    },
    {
      "id": 1,
      "name": "address"
    },
    {
      "id": 2,
      "name": "employee"
    },
    {
      "id": 3,
      "name": "family"
    }
  ],
  "attributes": [
    {
      "id": 7,
      "entityId": 1,
      "name": "Address",
      "value": "Spangsbjerg Møllevej 14A",
      "author": "AdamLorincz",
      "date": "2023-06-23T14:59:55.12"
    },
    {
      "id": 8,
      "entityId": 1,
      "name": "Alias",
      "value": "Martin",
      "author": "AdamLorincz",
      "date": "2023-06-23T15:00:28.708"
    },
    {
      "id": 9,
      "entityId": 2,
      "name": "Address",
      "value": "Spangsbjerg Møllevej 8F",
      "author": "AdamLorincz",
      "date": "2023-06-23T15:01:14.971"
    },
    {
      "id": 10,
      "entityId": 2,
      "name": "Phone",
      "value": "+45 52 70 90 06",
      "author": "AdamLorincz",
      "date": "2023-06-23T15:01:37.47"
    },
    {
      "id": 11,
      "entityId": 2,
      "name": "Public figure",
      "value": "This entity is a public figure",
      "author": "AdamLorincz",
      "date": "2023-06-23T15:02:18.746"
    },
    {
      "id": 12,
      "entityId": 2,
      "name": "Car",
      "value": "Toyota",
      "author": "AdamLorincz",
      "date": "2023-06-23T15:02:41.663"
    },
    {
      "id": 13,
      "entityId": 1,
      "name": "Car",
      "value": "Honda",
      "author": "AdamLorincz",
      "date": "2023-06-23T15:02:59.34"
    },
    {
      "id": 14,
      "entityId": 1,
      "name": "Phone",
      "value": "+45 52 70 90 50",
      "author": "AdamLorincz",
      "date": "2023-06-23T15:03:11.869"
    }
  ]
}`;

    const userPrompt = `Document Source: "${documentName}"
Full Document Text:
${text.slice(0, 100000)}

Read the entire document thoroughly without making up any details. Extract all entities and links into the exact requested JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      }
    }

    const rawEntities = Array.isArray(parsed.entities) ? parsed.entities : [];
    const rawLinks = Array.isArray(parsed.links) ? parsed.links : [];

    // Ensure IDs are strictly clean sequential integers
    const entities = rawEntities.map((e: any, idx: number) => ({
      id: typeof e.id === "number" && !isNaN(e.id) ? e.id : idx + 1,
      name: String(e.name || `Entity ${idx + 1}`).trim(),
      entityTypeId: typeof e.entityTypeId === "number" ? e.entityTypeId : 11,
    }));

    const validEntityIds = new Set(entities.map((e: any) => e.id));

    const links = rawLinks.map((l: any, idx: number) => {
      const e1 = typeof l.entityId1 === "number" && validEntityIds.has(l.entityId1) ? l.entityId1 : (entities[0]?.id || 1);
      const e2 = typeof l.entityId2 === "number" && validEntityIds.has(l.entityId2) ? l.entityId2 : (entities[1]?.id || entities[0]?.id || 1);
      return {
        id: typeof l.id === "number" && !isNaN(l.id) ? l.id : idx + 1,
        entityId1: e1,
        linkTypeId: typeof l.linkTypeId === "number" ? l.linkTypeId : 1,
        entityId2: e2,
        strength: typeof l.strength === "number" ? Math.min(1.0, Math.max(0.1, l.strength)) : 0.8,
        source: String(l.source || documentName),
      };
    });

    const rawEntityTypes = Array.isArray(parsed.entityTypes) ? parsed.entityTypes : [];
    const rawLinkTypes = Array.isArray(parsed.linkTypes) ? parsed.linkTypes : [];
    const rawAttributes = Array.isArray(parsed.attributes) ? parsed.attributes : [];

    // Ensure entityTypes always includes id -1 semantic_group + active types
    const entityTypesMap = new Map<number, string>();
    entityTypesMap.set(-1, "semantic_group");
    rawEntityTypes.forEach((t: any) => {
      if (typeof t.id === "number" && t.name) {
        entityTypesMap.set(t.id, String(t.name).toLowerCase());
      }
    });
    // Add any referenced entityTypeId not yet in map
    entities.forEach((e: any) => {
      if (!entityTypesMap.has(e.entityTypeId)) {
        entityTypesMap.set(e.entityTypeId, `type_${e.entityTypeId}`);
      }
    });
    const entityTypes = Array.from(entityTypesMap.entries()).map(([id, name]) => ({ id, name }));

    // Ensure linkTypes always includes id -1 semantic_link + active types
    const linkTypesMap = new Map<number, string>();
    linkTypesMap.set(-1, "semantic_link");
    rawLinkTypes.forEach((t: any) => {
      if (typeof t.id === "number" && t.name) {
        linkTypesMap.set(t.id, String(t.name).toLowerCase());
      }
    });
    // Add any referenced linkTypeId not yet in map
    links.forEach((l: any) => {
      if (!linkTypesMap.has(l.linkTypeId)) {
        linkTypesMap.set(l.linkTypeId, `link_${l.linkTypeId}`);
      }
    });
    const linkTypes = Array.from(linkTypesMap.entries()).map(([id, name]) => ({ id, name }));

    // Ensure attributes have valid sequential IDs and refer to valid entities
    const attributes = rawAttributes.map((a: any, idx: number) => ({
      id: typeof a.id === "number" && !isNaN(a.id) ? a.id : idx + 1,
      entityId: typeof a.entityId === "number" && validEntityIds.has(a.entityId) ? a.entityId : (entities[0]?.id || 1),
      name: String(a.name || "Attribute").trim(),
      value: String(a.value || "").trim(),
      author: String(a.author || "AdamLorincz"),
      date: String(a.date || new Date().toISOString()),
    }));

    res.json({
      entities,
      links,
      entityTypes,
      linkTypes,
      attributes,
      documentId,
      documentName,
      extractedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Entity extraction error:", err);
    res.status(500).json({ error: err.message || "Failed to extract entities and links." });
  }
});

// 5. Code Generator Endpoint for Python + Ollama App
app.post("/api/python/generate-code", (req, res) => {
  const {
    model = "llama3.2",
    host = "http://localhost:11434",
    framework = "streamlit",
    loader = "pypdf",
    mode = "executive",
    chunkSize = 2000,
    overlap = 200,
  } = req.body;

  const files = [
    {
      name: "app.py",
      language: "python",
      description: "Interactive Streamlit Web Dashboard for uploading documents & summarizing with Ollama",
      content: `import streamlit as st
import os
import time
from summarizer import OllamaDocSummarizer

st.set_page_config(
    page_title="Ollama Document Summarizer",
    page_icon="📚",
    layout="wide"
)

st.title("📚 Ollama Document Summarizer")
st.caption("Summarize PDF, Word, and Text documents locally using Ollama LLMs")

# Sidebar Configuration
with st.sidebar:
    st.header("⚙️ Ollama Settings")
    ollama_host = st.text_input("Ollama Host URL", value="${host}")
    selected_model = st.selectbox(
        "Select Local Model",
        ["${model}", "llama3.2", "llama3.1", "mistral", "gemma2", "phi3", "qwen2.5", "deepseek-r1"],
        index=0
    )
    
    st.divider()
    st.header("📝 Summarization Config")
    summary_mode = st.selectbox(
        "Summary Style",
        ["Executive Summary", "Bullet Points", "Key Takeaways", "Action Items", "Technical Analysis"]
    )
    
    chunk_size = st.number_input("Chunk Size (tokens/chars)", min_value=500, max_value=8000, value=${chunkSize}, step=500)
    chunk_overlap = st.number_input("Chunk Overlap", min_value=0, max_value=1000, value=${overlap}, step=50)
    temperature = st.slider("Temperature", min_value=0.0, max_value=1.0, value=0.3, step=0.1)

# Initialize Summarizer
summarizer = OllamaDocSummarizer(
    host=ollama_host,
    model=selected_model,
    chunk_size=chunk_size,
    overlap=chunk_overlap,
    temperature=temperature
)

# Test Ollama Connection
if st.sidebar.button("🔌 Test Connection"):
    with st.spinner("Checking Ollama connection..."):
        connected, msg = summarizer.check_connection()
        if connected:
            st.sidebar.success(f"Connected! Available models: {msg}")
        else:
            st.sidebar.error(f"Connection failed: {msg}")

# Main Interface: File Upload
uploaded_files = st.file_uploader(
    "Upload Documents (PDF, DOCX, TXT, MD)",
    type=["pdf", "docx", "txt", "md"],
    accept_multiple_files=True
)

if uploaded_files:
    st.subheader(f"📄 Uploaded Documents ({len(uploaded_files)})")
    
    cols = st.columns(min(len(uploaded_files), 3))
    for idx, file in enumerate(uploaded_files):
        with cols[idx % len(cols)]:
            st.info(f"**{file.name}** ({round(file.size/1024, 1)} KB)")

    if st.button("🚀 Summarize Documents", type="primary", use_container_width=True):
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        results = []
        start_time = time.time()
        
        for idx, file in enumerate(uploaded_files):
            status_text.text(f"Processing ({idx+1}/{len(uploaded_files)}): {file.name}...")
            
            # Save temporary file
            temp_path = os.path.join(".", file.name)
            with open(temp_path, "wb") as f:
                f.write(file.getbuffer())
            
            try:
                summary_data = summarizer.summarize_file(
                    file_path=temp_path,
                    mode=summary_mode
                )
                results.append((file.name, summary_data))
            except Exception as e:
                st.error(f"Error processing {file.name}: {str(e)}")
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            
            progress_bar.progress((idx + 1) / len(uploaded_files))
            
        status_text.text("✅ All summaries generated!")
        elapsed = round(time.time() - start_time, 2)
        st.success(f"Processed {len(results)} file(s) in {elapsed} seconds!")
        
        # Display Summaries
        st.divider()
        st.subheader("📊 Generated Summaries")
        
        for name, data in results:
            with st.expander(f"📌 Summary for: {name}", expanded=True):
                st.markdown(data["summary"])
                
                if data.get("key_points"):
                    st.write("**Key Takeaways:**")
                    for kp in data["key_points"]:
                        st.write(f"- {kp}")
                
                st.download_button(
                    label=f"💾 Download {name} Summary (.md)",
                    data=data["summary"],
                    file_name=f"{name}_summary.md",
                    mime="text/markdown"
                )
`,
    },
    {
      name: "summarizer.py",
      language: "python",
      description: "Core Document Reader, Text Chunker, and Ollama Local LLM Integrator module",
      content: `import os
import requests
import re
from typing import List, Dict, Any, Tuple

# Document loader dependencies
import pypdf
import docx

class OllamaDocSummarizer:
    def __init__(
        self,
        host: str = "${host}",
        model: str = "${model}",
        chunk_size: int = ${chunkSize},
        overlap: int = ${overlap},
        temperature: float = 0.3
    ):
        self.host = host.rstrip('/')
        self.model = model
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.temperature = temperature

    def check_connection(self) -> Tuple[bool, str]:
        """Check if local Ollama daemon is reachable."""
        try:
            res = requests.get(f"{self.host}/api/tags", timeout=3)
            if res.status_code == 200:
                data = res.json()
                models = [m.get('name') for m in data.get('models', [])]
                return True, ", ".join(models) if models else "No models pulled yet"
            return False, f"HTTP {res.status_code}"
        except Exception as e:
            return False, str(e)

    def extract_text(self, file_path: str) -> str:
        """Extract text from PDF, Word, or plain text files."""
        ext = os.path.splitext(file_path)[1].lower()
        text = ""

        if ext == ".pdf":
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\\n"
        elif ext in [".docx", ".doc"]:
            doc = docx.Document(file_path)
            text = "\\n".join([p.text for p in doc.paragraphs if p.text])
        elif ext in [".txt", ".md"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
        else:
            raise ValueError(f"Unsupported file format: {ext}")

        return text.strip()

    def chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping character/token chunks."""
        if len(text) <= self.chunk_size:
            return [text]

        chunks = []
        start = 0
        while start < len(text):
            end = start + self.chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += (self.chunk_size - self.overlap)

        return chunks

    def generate_ollama(self, prompt: str, system_prompt: str = "") -> str:
        """Query local Ollama API via REST."""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": self.temperature
            }
        }
        
        response = requests.post(f"{self.host}/api/generate", json=payload, timeout=120)
        if response.status_code != 200:
            raise Exception(f"Ollama API error {response.status_code}: {response.text}")
            
        data = response.json()
        return data.get("response", "").strip()

    def summarize_file(self, file_path: str, mode: str = "Executive Summary") -> Dict[str, Any]:
        """Read document, chunk if necessary, and produce structured summary."""
        full_text = self.extract_text(file_path)
        if not full_text:
            return {"summary": "Document contains no readable text.", "key_points": []}

        chunks = self.chunk_text(full_text)
        
        # Style prompt instructions
        mode_instructions = {
            "Executive Summary": "Write a high-level Executive Summary highlighting core purpose, key findings, and conclusions.",
            "Bullet Points": "Write a clear, structured bullet-point summary detailing main facts.",
            "Key Takeaways": "List the top 5-7 most important Key Takeaways and insights.",
            "Action Items": "Extract explicit action items, next steps, and recommendations.",
            "Technical Analysis": "Provide a deep technical breakdown with methodologies, specifications, and data points."
        }
        style_guide = mode_instructions.get(mode, "Provide a clear and concise summary.")

        if len(chunks) == 1:
            # Single pass summarization
            system_prompt = f"You are a professional document summarizer. {style_guide}"
            user_prompt = f"Summarize the following document content:\\n\\n{chunks[0]}"
            summary = self.generate_ollama(user_prompt, system_prompt)
        else:
            # Map-Reduce multi-chunk summarization
            chunk_summaries = []
            for idx, chunk in enumerate(chunks):
                sys_p = "Summarize this portion of a larger document concisely."
                usr_p = f"Chunk {idx+1}/{len(chunks)}:\\n\\n{chunk}"
                chunk_sum = self.generate_ollama(usr_p, sys_p)
                chunk_summaries.append(chunk_sum)

            combined_chunk_summary = "\\n\\n".join(chunk_summaries)
            system_prompt = f"You are combining multiple section summaries into one final document summary. {style_guide}"
            user_prompt = f"Synthesize these section summaries into a final coherent report:\\n\\n{combined_chunk_summary}"
            summary = self.generate_ollama(user_prompt, system_prompt)

        return {
            "summary": summary,
            "word_count_original": len(full_text.split()),
            "chunks_processed": len(chunks),
            "model_used": self.model
        }
`,
    },
    {
      name: "cli.py",
      language: "python",
      description: "Command Line Interface (CLI) tool for fast terminal document summarization",
      content: `#!/usr/bin/env python3
import argparse
import sys
import os
from summarizer import OllamaDocSummarizer

def main():
    parser = argparse.ArgumentParser(description="Summarize documents locally using Ollama")
    parser.add_argument("file", help="Path to PDF, DOCX, TXT, or MD file")
    parser.add_argument("--model", default="${model}", help="Ollama model name (default: ${model})")
    parser.add_argument("--host", default="${host}", help="Ollama server host (default: ${host})")
    parser.add_argument("--mode", default="Executive Summary", choices=["Executive Summary", "Bullet Points", "Key Takeaways", "Action Items", "Technical Analysis"])
    parser.add_argument("--output", "-o", help="Save summary output to Markdown file")

    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"❌ Error: File '{args.file}' not found.")
        sys.exit(1)

    print(f"🤖 Initializing Ollama with model '{args.model}' at {args.host}...")
    summarizer = OllamaDocSummarizer(host=args.host, model=args.model)

    connected, msg = summarizer.check_connection()
    if not connected:
        print(f"⚠️ Warning: Could not connect to Ollama server ({msg}). Ensure 'ollama serve' is running.")
        sys.exit(1)

    print(f"📖 Extracting & Summarizing '{args.file}' in [{args.mode}] mode...")
    try:
        result = summarizer.summarize_file(args.file, mode=args.mode)
        
        print("\\n" + "="*50)
        print("📄 GENERATED SUMMARY")
        print("="*50 + "\\n")
        print(result["summary"])
        print("\\n" + "="*50)

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(f"# Summary of {os.path.basename(args.file)}\\n\\n")
                f.write(result["summary"])
            print(f"💾 Saved summary to {args.output}")

    except Exception as e:
        print(f"❌ Error during summarization: {e}")

if __name__ == "__main__":
    main()
`,
    },
    {
      name: "requirements.txt",
      language: "plaintext",
      description: "Python package dependencies",
      content: `streamlit>=1.32.0
requests>=2.31.0
pypdf>=4.1.0
python-docx>=1.1.0
ollama>=0.1.7
`,
    },
    {
      name: "README.md",
      language: "markdown",
      description: "Comprehensive installation and setup guide",
      content: `# 📚 Ollama Local Document Summarizer

A complete Python application to read documents (PDF, Word DOCX, TXT, Markdown) and summarize their contents locally using **Ollama** large language models.

---

## ⚡ Prerequisites

1. **Install Ollama**: Download and install Ollama from [ollama.com](https://ollama.com).
2. **Pull a Model**:
   \`\`\`bash
   ollama pull ${model}
   # Or try other great models:
   # ollama pull llama3.2
   # ollama pull mistral
   # ollama pull deepseek-r1
   \`\`\`
3. **Ensure Ollama Server is Running**:
   \`\`\`bash
   ollama serve
   \`\`\`

---

## 🚀 Quick Start

1. **Clone or Extract Project Files**
2. **Create a Virtual Environment**:
   \`\`\`bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`
3. **Install Dependencies**:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

---

## 🖥️ Usage Options

### Option A: Launch Web GUI (Streamlit)
\`\`\`bash
streamlit run app.py
\`\`\`
Open your browser at \`http://localhost:8501\` to drag and drop documents and customize summaries!

### Option B: Terminal CLI
\`\`\`bash
python cli.py my_document.pdf --model ${model} --mode "Executive Summary" -o summary.md
\`\`\`
`,
    },
  ];

  res.json({
    title: "Python Ollama Document Summarizer",
    description: "Fully automated, chunking-aware Python application using Streamlit and Ollama REST API.",
    files,
    setupCommands: [
      "python3 -m venv venv",
      "source venv/bin/activate",
      "pip install -r requirements.txt",
      `ollama pull ${model}`,
    ],
    runCommands: [
      "streamlit run app.py",
      `python cli.py my_document.pdf --model ${model}`,
    ],
  });
});

// Vite / Production Static File Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
