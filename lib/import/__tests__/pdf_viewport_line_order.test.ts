import { describe, expect, it } from "vitest";
import { group_text_items_into_lines } from "@/lib/import/pdf_layout";
import { layout_items_from_viewport } from "@/lib/import/pdf_text_coords";
import { parse_pbe_savings_statement } from "@/lib/import/parsers/pbe_savings";
import { validate_running_balance as pbe_savings_validate } from "@/lib/import/institutions/pbe_savings/validate";

/** pdfjs `page.getViewport({ scale: 1 }).transform` for an unrotated A4 page. */
const A4_VIEWPORT = [1, 0, 0, -1, 0, 842];

/** Synthetic lines placed top-down in PDF user space (y-up), as a real PDF stores them. */
function items_from_lines(lines: string[]) {
  let y = 800;
  return lines.map((str) => {
    const item = { str, transform: [1, 0, 0, 1, 40, y], width: str.length * 5 };
    y -= 14;
    return item;
  });
}

describe("pdf viewport line order", () => {
  it("emits lines top-to-bottom for an unrotated page", () => {
    const items = layout_items_from_viewport(
      items_from_lines(["FIRST LINE", "SECOND LINE", "THIRD LINE"]),
      A4_VIEWPORT,
    );
    expect(group_text_items_into_lines(items)).toEqual([
      "FIRST LINE",
      "SECOND LINE",
      "THIRD LINE",
    ]);
  });

  it("keeps a savings statement chronological so same-day balances validate", () => {
    const lines = [
      "Public Bank Berhad",
      "PENYATA AKAUN / STATEMENT OF ACCOUNT",
      "Jenis Akaun / Account Type   RM Cm Savings Acct-i",
      "Tarikh Penyata / Statement Date   30 Nov 2026",
      "TARIKH URUS NIAGA DEBIT KREDIT BAKI",
      "DATE TRANSACTION DEBIT CREDIT BALANCE",
      "Balance From Last Statement 50.00",
      "02/11  SYNTH TRANSFER IN A   10.00   60.00",
      "SYNTH SAME DAY DEBIT B   5.00   55.00",
      "SYNTH SAME DAY DEBIT C   3.00   52.00",
      "09/11  SYNTH FINAL DEBIT D   2.00   50.00",
      "Closing Balance In This Statement 50.00",
    ];
    const text = group_text_items_into_lines(
      layout_items_from_viewport(items_from_lines(lines), A4_VIEWPORT),
    ).join("\n");
    expect(text.indexOf("SYNTH TRANSFER IN A")).toBeLessThan(
      text.indexOf("SYNTH FINAL DEBIT D"),
    );
    const { rows } = parse_pbe_savings_statement(text);
    expect(rows).toHaveLength(4);
    pbe_savings_validate(rows, "asset");
    expect(rows.filter((r) => r.status === "needs_review")).toEqual([]);
  });
});