# Ollama Document AI

A privacy-first, minimal document summarization and Q&A application powered by local **Ollama** models (with automatic cloud API fallback).

---

## 📋 Prerequisites

Before running the application locally, you will need:
1. **Node.js** (v18 or higher) and **npm**
2. **Ollama** (for running local AI models like `qwen3:8b` / `qwen3`)

---

## 🚀 Step-by-Step Installation Guide

### Step 1: Install Node.js & npm

1. Download the latest **LTS version** of Node.js from the official website: [https://nodejs.org/](https://nodejs.org/)
2. Run the installer and accept default settings (npm is included automatically).
3. Verify installation by opening a new Command Prompt or Terminal and running:
   ```bash
   node -v
   npm -v
   ```

---

### Step 2: Install and Configure Ollama

1. Download Ollama for Windows/macOS/Linux from: [https://ollama.com/download](https://ollama.com/download)
2. Run `OllamaSetup.exe` to install it.

> ⚠️ **Windows Smart App Control Notice**:
> If Windows blocks `OllamaSetup.exe` with a "Smart App Control blocked an app that may be unsafe" warning:
> - Click **More Info** or check **Windows Security > App & browser control**.
> - Select **Allow** or unblock the file in your Downloads folder (*Right-click file > Properties > Check 'Unblock' > Apply*).

3. **Start the Ollama App**:
   - Launch Ollama from your Start menu or Applications folder. An Ollama icon will appear in your system tray.

4. **Pull the Qwen3 8B Model**:
   - Open a **new** Command Prompt / Terminal window.
   > 📌 **Note**: You must restart/open a *new* CMD window after installing Ollama so the system recognizes the `ollama` command line PATH.
   - Run the following command:
     ```bash
     ollama pull qwen3:8b
     ```
   - Wait for the download to complete.

5. Verify Ollama is running locally:
   ```bash
   ollama list
   ```

---

### Step 3: Run the Application

1. Open your terminal in the root folder of this project.
2. Install project dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:4000
   ```

---

## 💡 How to Use

1. **Upload Document**: Drag & drop or click to upload a PDF, Word DOCX, Vessel Manifest, Markdown, or TXT file.
2. **Summarize Document**: Click the **Summarize Document** button to generate a structured summary using your local `qwen3:8b` (Qwen3 8B) model.
3. **Analyze Risk Profile**: Click **Analyze Risk Profile** to have the LLM automatically connect document text phrases (e.g., `"Cargo load: 34,500 kg"`) to defined formula variables (`cargo_load = 34500`), evaluate your CRUD risk rules (`cargo_load > 30000 -> +30% Risk`), and generate an actionable risk scorecard.
4. **CRUD Risk Rules**: Click **CRUD Risk Rules** in the header to create, edit, or delete custom risk formulas and threshold conditions.
5. **Ask Questions**: Type any question about the uploaded document in the input field below and press **Ask**.


---

## 🔧 Troubleshooting

| Issue | Solution |
| :--- | :--- |
| `'ollama' is not recognized as an internal or external command` | Close all open Command Prompt windows and open a **new** Command Prompt window. The system needs to reload your environment `PATH` variable after installation. |
| `Smart App Control blocked OllamaSetup.exe` | Right-click `OllamaSetup.exe` in your Downloads folder, choose **Properties**, check the **Unblock** checkbox at the bottom, and click **OK**. |
| `Local Ollama offline` status in the app | Ensure Ollama is running in your taskbar / background system tray, or run `ollama serve` in a terminal. |

---

## ⚙️ Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start development server on http://localhost:4000
npm run build    # Build for production
npm start        # Run production build
```
