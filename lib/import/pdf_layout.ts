/** Reconstruct reading-order lines from pdfjs-dist text items (per page). */

export type PdfLayoutItem = {
  str: string;
  x: number;
  y: number;
  width?: number;
};

const Y_TOLERANCE = 2.5;

export function group_text_items_into_lines(
  items: PdfLayoutItem[],
  y_tolerance = Y_TOLERANCE,
): string[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => {
    const y_diff = b.y - a.y;
    if (Math.abs(y_diff) > y_tolerance) return y_diff;
    return a.x - b.x;
  });

  const groups: PdfLayoutItem[][] = [];
  for (const item of sorted) {
    const last = groups.at(-1);
    if (!last || Math.abs(last[0].y - item.y) > y_tolerance) {
      groups.push([item]);
    } else {
      last.push(item);
    }
  }

  return groups.map((group) => join_line_tokens(group));
}

export function join_line_tokens(tokens: PdfLayoutItem[]): string {
  const ordered = [...tokens].sort((a, b) => a.x - b.x);
  let out = "";
  let prev_end = 0;
  for (const token of ordered) {
    const text = token.str;
    if (!text) continue;
    if (prev_end > 0) {
      const gap = token.x - prev_end;
      if (gap > 18) out += "   ";
      else if (gap > 6) out += "  ";
      else if (gap > 1) out += " ";
    }
    out += text;
    const width = token.width ?? text.length * 5.2;
    prev_end = token.x + width;
  }
  return out.trim();
}

/** Build multi-page plain text from layout items tagged by page (for tests). */
export function layout_text_from_items(
  items: Array<PdfLayoutItem & { page: number }>,
): string {
  const pages = new Map<number, PdfLayoutItem[]>();
  for (const item of items) {
    const list = pages.get(item.page) ?? [];
    list.push(item);
    pages.set(item.page, list);
  }
  const page_nums = [...pages.keys()].sort((a, b) => a - b);
  return page_nums
    .map((p) => group_text_items_into_lines(pages.get(p) ?? []).join("\n"))
    .join("\n");
}