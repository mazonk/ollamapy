import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { DocumentFile } from "../types";

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function parseUploadedFile(file: File): Promise<DocumentFile> {
  const fileName = file.name;
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  let extractedText = "";
  let pageCount: number | undefined = undefined;

  if (extension === "pdf") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pageCount = pdf.numPages;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }
      extractedText = fullText.trim();
    } catch (err) {
      console.warn("PDF.js direct parse failed, falling back to basic text reader:", err);
      extractedText = await readAsText(file);
    }
  } else if (extension === "docx") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value.trim();
    } catch (err) {
      console.warn("Mammoth parse failed, reading plain text:", err);
      extractedText = await readAsText(file);
    }
  } else {
    // Plain text, markdown, json, csv
    extractedText = await readAsText(file);
  }

  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;

  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    name: fileName,
    size: file.size,
    type: mapFileType(extension),
    text: extractedText || "No extractable text found in file.",
    pageCount,
    wordCount,
    createdAt: new Date().toISOString(),
  };
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

function mapFileType(ext: string): 'pdf' | 'docx' | 'txt' | 'md' | 'json' | 'csv' {
  switch (ext) {
    case 'pdf': return 'pdf';
    case 'docx':
    case 'doc': return 'docx';
    case 'md': return 'md';
    case 'json': return 'json';
    case 'csv': return 'csv';
    default: return 'txt';
  }
}
