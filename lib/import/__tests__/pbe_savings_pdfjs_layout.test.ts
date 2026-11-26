import { describe, expect, it } from "vitest";
import { layout_text_from_items } from "@/lib/import/pdf_layout";
import { parse_pbe_savings_statement } from "@/lib/import/parsers/pbe_savings";
import { statement_detection_corpus } from "@/lib/import/statement_detection";
import { pbe_savings_is_likely_statement } from "@/lib/import/parsers/pbe_savings";

describe("pbe_savings parser with pdfjs-style layout", () => {
  it("parses split debit/balance tokens and undated credit rows", () => {
    const y_hdr = 740;
    const y_date = 700;
    const y_tbl = 680;
    const y_open = 660;
    const y_t1 = 640;
    const y_t1c = 625;
    const y_t2 = 600;
    const y_t3 = 580;

    const items = [
      { page: 1, str: "PUBLIC", x: 40, y: y_hdr },
      { page: 1, str: "BANK", x: 100, y: y_hdr },
      { page: 1, str: "BERHAD", x: 145, y: y_hdr },
      { page: 1, str: "PENYATA AKAUN", x: 40, y: y_hdr - 20 },
      { page: 1, str: "STATEMENT OF ACCOUNT", x: 160, y: y_hdr - 20 },
      { page: 1, str: "Statement", x: 40, y: y_date },
      { page: 1, str: "Date", x: 100, y: y_date },
      { page: 1, str: "20", x: 220, y: y_date },
      { page: 1, str: "NOV", x: 245, y: y_date },
      { page: 1, str: "2026", x: 275, y: y_date },
      { page: 1, str: "TARIKH", x: 40, y: y_tbl },
      { page: 1, str: "URUS", x: 95, y: y_tbl },
      { page: 1, str: "NIAGA", x: 130, y: y_tbl },
      { page: 1, str: "DEBIT", x: 300, y: y_tbl },
      { page: 1, str: "KREDIT", x: 360, y: y_tbl },
      { page: 1, str: "BAKI", x: 420, y: y_tbl },
      { page: 1, str: "Balance", x: 40, y: y_open },
      { page: 1, str: "From", x: 95, y: y_open },
      { page: 1, str: "Last", x: 130, y: y_open },
      { page: 1, str: "Statement", x: 165, y: y_open },
      { page: 1, str: "30.00", x: 450, y: y_open },
      { page: 1, str: "23/10", x: 40, y: y_t1 },
      { page: 1, str: "DUITNOW", x: 80, y: y_t1 },
      { page: 1, str: "QR", x: 145, y: y_t1 },
      { page: 1, str: "DR", x: 170, y: y_t1 },
      { page: 1, str: "6.00", x: 310, y: y_t1 },
      { page: 1, str: "24.00", x: 450, y: y_t1 },
      { page: 1, str: "REF", x: 90, y: y_t1c },
      { page: 1, str: "SYNTH-QR", x: 125, y: y_t1c },
      { page: 1, str: "01/11", x: 40, y: y_t2 },
      { page: 1, str: "SEED", x: 80, y: y_t2 },
      { page: 1, str: "6.00", x: 310, y: y_t2 },
      { page: 1, str: "18.00", x: 450, y: y_t2 },
      { page: 1, str: "CR", x: 80, y: y_t3 },
      { page: 1, str: "CARD", x: 105, y: y_t3 },
      { page: 1, str: "PYMT", x: 145, y: y_t3 },
      { page: 1, str: "8.00", x: 360, y: y_t3 },
      { page: 1, str: "26.00", x: 450, y: y_t3 },
      { page: 1, str: "Closing", x: 40, y: y_t3 - 35 },
      { page: 1, str: "Balance", x: 95, y: y_t3 - 35 },
      { page: 1, str: "26.00", x: 450, y: y_t3 - 35 },
    ];

    const text = layout_text_from_items(items);
    const corpus = statement_detection_corpus(text, {
      creator: "Public Bank Berhad",
    });
    expect(pbe_savings_is_likely_statement(corpus)).toBe(true);

    const { rows, meta } = parse_pbe_savings_statement(text);
    expect(meta.opening_balance_major).toBe("30.00");
    expect(rows).toHaveLength(3);
    expect(rows.some((r) => r.description.includes("SYNTH-QR"))).toBe(true);
    expect(rows.find((r) => r.txn_type === "cc_payment")?.amount_major).toBe(
      "8.00",
    );
  });
});