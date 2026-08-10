import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Set worker source for pdfjs-dist to local bundle (offline support)
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export async function parseDocumentFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".pdf")) {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const pageTexts: string[] = [];

      const numPagesToRead = Math.min(pdf.numPages, 30);
      for (let pageNo = 1; pageNo <= numPagesToRead; pageNo++) {
        const page = await pdf.getPage(pageNo);
        const textContent = await page.getTextContent();
        const pageString = textContent.items
          .map((item: any) => item.str || "")
          .join(" ");
        pageTexts.push(pageString);
      }
      return pageTexts.join("\n\n");
    } catch (err: any) {
      if (err.name === "PasswordException") {
        throw new Error("Dokumen PDF dilindungi oleh password. Silakan hilangkan password terlebih dahulu.");
      }
      throw err;
    }
  } else if (fileName.endsWith(".docx")) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || "";
  } else if (
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".csv") ||
    fileName.endsWith(".json")
  ) {
    // Standard text files
    return await file.text();
  } else {
    throw new Error("Format file tidak didukung. Harap unggah dokumen teks (.txt, .md, dsb), .pdf, atau .docx.");
  }
}
