import { describe, expect, it } from "vitest";
import { group_text_items_into_lines } from "@/lib/import/pdf_layout";
import { layout_items_from_viewport } from "@/lib/import/pdf_text_coords";
import { parse_pbe_savings_statement } from "@/lib/import/parsers/pbe_savings";
import { validate_running_balance } from "@/lib/import/institutions/pbe_savings/validate";

/** Unrotated A4 viewport at scale 1 (y-down), as pdfjs returns. */
const VIEWPORT = [1, 0, 0, -1, 0, 842];
const FONT = 9;

/**
 * pdfjs text item: `transform` carries the font size (a = d = 9) and `width`
 * is in page units (already includes the font size), ~0.5 em per character.
 */
function item(str: string, x: number, y: number) {
  return {
    str,
    transform: [FONT, 0, 0, FONT, x, y],
    width: str.length * FONT * 0.5,
  };
}

/** Right-aligned money column ends at `right`. */
function money(str: string, right: number, y: number) {
  const width = str.length * FONT * 0.5;
  return { str, transform: [FONT, 0, 0, FONT, right - width, y], width };
}

describe("pdf item width scaling (font size must not inflate widths)", () => {
  it("keeps a gap between a description and the amount column that follows", () => {
    const lines = group_text_items_into_lines(
      layout_items_from_viewport(
        [item("SYNTH DESCRIPTION WORDS", 90, 700), money("12.50", 340, 700), money("99.00", 520, 700)],
        VIEWPORT,
      ),
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/WORDS\s+12\.50\s+99\.00$/);
  });

  it("does not glue a trailing reference number to the debit amount", () => {
    const lines = group_text_items_into_lines(
      layout_items_from_viewport(
        [item("SYNTH PYMT-REF 123456", 90, 700), money("91.90", 345, 700), money("20.00", 520, 700)],
        VIEWPORT,
      ),
    );
    expect(lines[0]).toMatch(/123456\s+91\.90\s+20\.00$/);
  });

  it("parses a two-page savings layout with undated carry-over rows and zero-amount fees", () => {
    const y = (n: number) => 800 - n * 14;
    const page1 = [
      item("PENYATA AKAUN / STATEMENT OF ACCOUNT", 300, y(0)),
      item("Jenis Akaun / Account Type", 300, y(1)),
      item("RM Cm Savings Acct-i", 450, y(1)),
      item("Tarikh Penyata / Statement Date", 300, y(2)),
      item("20 Nov 2026", 470, y(2)),
      item("Baki Penutup / Closing Balance", 300, y(3)),
      money("12.00", 560, y(3)),
      item("Jumlah Debit / Total Debits", 300, y(4)),
      money("113.00", 560, y(4)),
      item("Bil. Debit / No. of Debits", 300, y(5)),
      money("4", 560, y(5)),
      item("Jumlah Kredit / Total Credits", 300, y(6)),
      money("100.00", 560, y(6)),
      item("Bil. Kredit / No. of Credits", 300, y(7)),
      money("1", 560, y(7)),
      item("DATE", 40, y(8)),
      item("TRANSACTION", 90, y(8)),
      item("20/10", 40, y(9)),
      item("Balance From Last Statement", 90, y(9)),
      money("25.00", 520, y(9)),
      item("23/10", 40, y(10)),
      item("SYNTH QR DR 111111 SAMPLE PAYEE", 90, y(10)),
      money("5.00", 345, y(10)),
      money("20.00", 520, y(10)),
      item("01/11", 40, y(11)),
      item("SYNTH TRSF CR 222222 SAMPLE SENDER", 90, y(11)),
      money("100.00", 410, y(11)),
      money("120.00", 520, y(11)),
      item("SYNTH CARD PYMT-ATM/EFT 333333", 90, y(12)),
      money("100.00", 345, y(12)),
      money("20.00", 520, y(12)),
      item("Balance C/F", 90, y(13)),
      money("20.00", 520, y(13)),
    ];
    const page2 = [
      item("DATE", 40, y(0)),
      item("TRANSACTION", 90, y(0)),
      item("01/11", 40, y(1)),
      item("Balance B/F", 90, y(1)),
      money("20.00", 520, y(1)),
      item("SYNTH SST HANDLING CHRG", 90, y(2)),
      money("0.00", 345, y(2)),
      money("20.00", 520, y(2)),
      item("04/11", 40, y(3)),
      item("SYNTH HANDLING CHRG", 90, y(3)),
      money("8.00", 345, y(3)),
      money("12.00", 520, y(3)),
      item("Closing Balance In This Statement", 90, y(4)),
      money("12.00", 520, y(4)),
    ];
    const text = [page1, page2]
      .map((page) =>
        group_text_items_into_lines(
          layout_items_from_viewport(page, VIEWPORT),
        ).join("\n"),
      )
      .join("\n");
    const parsed = parse_pbe_savings_statement(text);
    expect(parsed.rows).toHaveLength(5);
    validate_running_balance(parsed.rows, "asset");
    expect(parsed.rows.filter((r) => r.status === "needs_review")).toEqual([]);
    const card = parsed.rows.find((r) => r.txn_type === "cc_payment");
    expect(card?.direction).toBe("out");
    expect(card?.amount_major).toBe("100.00");
    expect(card?.balance_after_major).toBe("20.00");
  });
});