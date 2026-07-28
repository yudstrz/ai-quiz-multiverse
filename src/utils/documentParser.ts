import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Set worker source for pdfjs-dist
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export async function parseDocumentFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".pdf")) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    const numPagesToRead = Math.min(pdf.numPages, 12);
    for (let pageNo = 1; pageNo <= numPagesToRead; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const textContent = await page.getTextContent();
      const pageString = textContent.items
        .map((item: any) => item.str || "")
        .join(" ");
      pageTexts.push(pageString);
    }
    return pageTexts.join("\n\n");
  } else if (fileName.endsWith(".docx")) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || "";
  } else {
    // Standard text files (.txt, .md, .csv, .json)
    return await file.text();
  }
}
