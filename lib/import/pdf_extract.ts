/**
 * Browser-only PDF text extraction. Uses pdfjs-dist; optional tesseract.js OCR
 * when a page has no text layer. No third-party network APIs.
 */
import { group_text_items_into_lines, type PdfLayoutItem } from "@/lib/import/pdf_layout";

export type PdfDocMeta = {
  title?: string;
  author?: string;
  creator?: string;
};

export async function extract_pdf_text_local(
  buffer: ArrayBuffer,
): Promise<{ text: string; ocr_pages: number; meta: PdfDocMeta }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const metadata = await doc.getMetadata().catch(() => null);
  const info = metadata?.info as Record<string, string> | undefined;
  const meta: PdfDocMeta = {
    title: info?.Title,
    author: info?.Author,
    creator: info?.Creator,
  };
  let ocr_pages = 0;
  const parts: string[] = [];

  for (let page_num = 1; page_num <= doc.numPages; page_num++) {
    const page = await doc.getPage(page_num);
    const content = await page.getTextContent();
    const layout_items: PdfLayoutItem[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      const transform = item.transform;
      layout_items.push({
        str: item.str,
        x: transform[4],
        y: transform[5],
        width: typeof item.width === "number" ? item.width : undefined,
      });
    }
    const page_lines = group_text_items_into_lines(layout_items);
    const page_text = page_lines.join("\n").trim();
    if (page_text.length > 20) {
      parts.push(page_text);
      continue;
    }
    ocr_pages += 1;
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) continue;
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(blob);
    await worker.terminate();
    if (data.text?.trim()) parts.push(data.text.trim());
  }

  return { text: parts.join("\n"), ocr_pages, meta };
}