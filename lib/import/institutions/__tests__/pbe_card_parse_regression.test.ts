import { describe, expect, it } from "vitest";
import { layout_text_from_items } from "@/lib/import/pdf_layout";
import { parse_pbe_card_statement } from "@/lib/import/parsers/pbe_card";
import { readFileSync } from "node:fs";
import path from "node:path";

const fixture_path = path.join(
  process.cwd(),
  "test/fixtures/import/pbe_card_statement_synthetic.txt",
);

describe("pbe_card parse regression", () => {
  it("parses pdfjs column-split transaction rows with glued CR suffix", () => {
    const y = 700;
    const items = [
      { page: 1, str: "PUBLIC", x: 40, y: 820 },
      { page: 1, str: "BANK", x: 100, y: 820 },
      { page: 1, str: "PENYATA", x: 40, y: 800 },
      { page: 1, str: "KAD", x: 100, y: 800 },
      { page: 1, str: "Statement", x: 40, y: 780 },
      { page: 1, str: "Date", x: 110, y: 780 },
      { page: 1, str: "16", x: 200, y: 780 },
      { page: 1, str: "NOV", x: 225, y: 780 },
      { page: 1, str: "2026", x: 260, y: 780 },
      { page: 1, str: "MASTERCARD", x: 40, y: 760 },
      { page: 1, str: "QUANTUM", x: 130, y: 760 },
      { page: 1, str: "6357", x: 300, y: 760 },
      { page: 1, str: "Maklumat", x: 40, y: 740 },
      { page: 1, str: "Transaksi", x: 110, y: 740 },
      { page: 1, str: "17", x: 40, y: y },
      { page: 1, str: "OCT", x: 65, y: y },
      { page: 1, str: "Previous", x: 120, y: y },
      { page: 1, str: "Balance", x: 190, y: y },
      { page: 1, str: "25.00", x: 450, y: y },
      { page: 1, str: "25", x: 40, y: y - 20 },
      { page: 1, str: "OCT", x: 65, y: y - 20 },
      { page: 1, str: "25", x: 120, y: y - 20 },
      { page: 1, str: "OCT", x: 145, y: y - 20 },
      { page: 1, str: "MR", x: 200, y: y - 20 },
      { page: 1, str: "DIY", x: 225, y: y - 20 },
      { page: 1, str: "STORE", x: 260, y: y - 20 },
      { page: 1, str: "16.90", x: 450, y: y - 20 },
      { page: 1, str: "01", x: 40, y: y - 40 },
      { page: 1, str: "NOV", x: 65, y: y - 40 },
      { page: 1, str: "01", x: 120, y: y - 40 },
      { page: 1, str: "NOV", x: 145, y: y - 40 },
      { page: 1, str: "PBeBANK", x: 200, y: y - 40 },
      { page: 1, str: "PAYMENT", x: 260, y: y - 40 },
      { page: 1, str: "91.90CR", x: 450, y: y - 40 },
      { page: 1, str: "Grand", x: 40, y: y - 65 },
      { page: 1, str: "total", x: 85, y: y - 65 },
      { page: 1, str: "0.00", x: 450, y: y - 65 },
    ];
    const text = layout_text_from_items(items);
    const { rows, parse_warning } = parse_pbe_card_statement(text);
    expect(parse_warning).toBeNull();
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.some((r) => r.description.includes("MR DIY"))).toBe(true);
    const payment = rows.find((r) => r.description.includes("PBeBANK"));
    expect(payment?.direction).toBe("in");
    expect(payment?.amount_major).toBe("91.90");
  });

  it("still parses the committed synthetic fixture unchanged", () => {
    const text = readFileSync(fixture_path, "utf8");
    const { rows, parse_warning } = parse_pbe_card_statement(text);
    expect(parse_warning).toBeNull();
    expect(rows).toHaveLength(4);
  });
});