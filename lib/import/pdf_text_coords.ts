import type { PdfLayoutItem } from "@/lib/import/pdf_layout";

/**
 * Same composition as pdfjs-dist `Util.transform(m1, m2)` (affine 2×3).
 */
export function pdf_affine_transform(
  m1: number[],
  m2: number[],
): number[] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

export type PdfjsTextItem = {
  str: string;
  transform: number[];
  width?: number;
};

/**
 * Map pdfjs text items to viewport x and y-up visual position for stable line
 * grouping (rotation-safe). Returned `y` grows towards the top of the page.
 */
export function layout_items_from_viewport(
  items: PdfjsTextItem[],
  viewport_transform: number[],
): PdfLayoutItem[] {
  const out: PdfLayoutItem[] = [];
  for (const item of items) {
    if (!item.str) continue;
    const tx = pdf_affine_transform(viewport_transform, item.transform);
    const x = tx[4];
    // Viewport space is y-down (canvas). `group_text_items_into_lines` expects
    // PDF-style y-up (larger y = nearer the top), so flip here; otherwise every
    // page is emitted bottom-to-top and multi-line records/balances break.
    const y = -tx[5];
    const glyph_scale = Math.hypot(tx[0], tx[1]) || 1;
    // pdfjs `item.width` is already in page user-space units (font size is
    // baked in), so only the viewport scale applies. Multiplying by the glyph
    // scale (font size, e.g. 9) inflated every width ~9x, pushed `prev_end`
    // past the next token and glued adjacent columns ("NAME88.91", "33657791.90").
    const viewport_scale =
      Math.hypot(viewport_transform[0], viewport_transform[1]) || 1;
    const width =
      typeof item.width === "number"
        ? item.width * viewport_scale
        : item.str.length * glyph_scale * 0.55;
    out.push({ str: item.str, x, y, width });
  }
  return out;
}

/** Typical pdfjs viewport.transform for A4 page with /Rotate 90 (synthetic tests). */
export function a4_rotate_90_viewport_transform(page_width = 595): number[] {
  return [0, -1, 1, 0, 0, page_width];
}