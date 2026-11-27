/** Reconstruct reading-order lines from pdfjs-dist text items (per page). */

export type PdfLayoutItem = {
  str: string;
  x: number;
  y: number;
  width?: number;
};

const LINE_TOLERANCE = 2.5;

export type LineGroupAxis = "x" | "y";

export function line_group_axis_for_rotation(rotation_deg: number): LineGroupAxis {
  const norm = ((rotation_deg % 360) + 360) % 360;
  return norm === 90 || norm === 270 ? "x" : "y";
}

export function group_text_items_into_lines(
  items: PdfLayoutItem[],
  tolerance = LINE_TOLERANCE,
  axis: LineGroupAxis = "y",
): string[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => {
    if (axis === "y") {
      const y_diff = b.y - a.y;
      if (Math.abs(y_diff) > tolerance) return y_diff;
      return a.x - b.x;
    }
    const x_diff = a.x - b.x;
    if (Math.abs(x_diff) > tolerance) return x_diff;
    return b.y - a.y;
  });

  const groups: PdfLayoutItem[][] = [];
  for (const item of sorted) {
    const last = groups.at(-1);
    const same_line =
      axis === "y"
        ? last && Math.abs(last[0].y - item.y) <= tolerance
        : last && Math.abs(last[0].x - item.x) <= tolerance;
    if (!last || !same_line) {
      groups.push([item]);
    } else {
      last.push(item);
    }
  }

  return groups.map((group) => join_line_tokens(group, axis));
}

export function join_line_tokens(
  tokens: PdfLayoutItem[],
  axis: LineGroupAxis = "y",
): string {
  const ordered = [...tokens].sort((a, b) =>
    axis === "y" ? a.x - b.x : b.y - a.y,
  );
  if (axis === "x") {
    return ordered
      .map((token) => token.str.trim())
      .filter(Boolean)
      .join(" ");
  }
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