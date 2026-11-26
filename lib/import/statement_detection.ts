import type { PdfDocMeta } from "@/lib/import/pdf_extract";

/** Plain text plus PDF document metadata for parser matching only (not for row parsing). */
export function statement_detection_corpus(
  text: string,
  meta?: PdfDocMeta | null,
): string {
  const parts = [text];
  if (meta?.title?.trim()) parts.push(meta.title.trim());
  if (meta?.author?.trim()) parts.push(meta.author.trim());
  if (meta?.creator?.trim()) parts.push(meta.creator.trim());
  return parts.join("\n");
}