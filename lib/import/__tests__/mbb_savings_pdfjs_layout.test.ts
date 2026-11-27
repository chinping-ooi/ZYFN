import { describe, expect, it } from "vitest";
import { layout_text_from_items } from "@/lib/import/pdf_layout";
import {
  mbb_savings_is_likely_statement,
  parse_mbb_savings_statement,
} from "@/lib/import/parsers/mbb_savings";
import { statement_detection_corpus } from "@/lib/import/statement_detection";

describe("mbb_savings parser with pdfjs-style layout", () => {
  it("detects and parses when amount sign and balance are split across tokens/lines", () => {
    const y_title = 750;
    const y_header = 720;
    const y_cols = 700;
    const y_stmt = 680;
    const y_open = 660;
    const y_txn1a = 640;
    const y_txn1b = 628;
    const y_txn1c = 616;
    const y_txn2 = 594;
    const y_end = 560;

    const items = [
      { page: 1, str: "Maybank", x: 40, y: y_title + 20 },
      { page: 1, str: "Islamic", x: 100, y: y_title + 20 },
      { page: 1, str: "URUSNIAGA", x: 40, y: y_header },
      { page: 1, str: "AKAUN", x: 120, y: y_header },
      { page: 1, str: "ACCOUNT", x: 40, y: y_header - 14 },
      { page: 1, str: "TRANSACTIONS", x: 110, y: y_header - 14 },
      { page: 1, str: "ENTRY", x: 40, y: y_cols },
      { page: 1, str: "DATE", x: 75, y: y_cols },
      { page: 1, str: "STATEMENT", x: 420, y: y_cols },
      { page: 1, str: "BALANCE", x: 500, y: y_cols },
      { page: 1, str: "TARIKH", x: 40, y: y_stmt },
      { page: 1, str: "PENYATA", x: 95, y: y_stmt },
      { page: 1, str: "31/10/26", x: 200, y: y_stmt },
      { page: 1, str: "BEGINNING", x: 40, y: y_open },
      { page: 1, str: "BALANCE", x: 120, y: y_open },
      { page: 1, str: "1,000.00", x: 480, y: y_open },
      { page: 1, str: "03/10", x: 48, y: y_txn1a },
      { page: 1, str: "PAYMENT", x: 95, y: y_txn1a },
      { page: 1, str: "FR", x: 155, y: y_txn1a },
      { page: 1, str: "A/C", x: 175, y: y_txn1a },
      { page: 1, str: "10.70", x: 350, y: y_txn1a },
      { page: 1, str: "-", x: 392, y: y_txn1a },
      { page: 1, str: "989.30", x: 480, y: y_txn1a },
      { page: 1, str: "MAYBANK", x: 70, y: y_txn1b },
      { page: 1, str: "VISA", x: 135, y: y_txn1b },
      { page: 1, str: "CARD", x: 170, y: y_txn1b },
      { page: 1, str: "*", x: 210, y: y_txn1b },
      { page: 1, str: "XXXX-1234", x: 70, y: y_txn1c },
      { page: 1, str: "05/10", x: 48, y: y_txn2 },
      { page: 1, str: "TRANSFER", x: 95, y: y_txn2 },
      { page: 1, str: "TO", x: 165, y: y_txn2 },
      { page: 1, str: "A/C", x: 185, y: y_txn2 },
      { page: 1, str: "25.00", x: 350, y: y_txn2 },
      { page: 1, str: "+", x: 392, y: y_txn2 },
      { page: 1, str: "1,014.30", x: 470, y: y_txn2 },
      { page: 1, str: "ENDING", x: 40, y: y_end },
      { page: 1, str: "BALANCE", x: 100, y: y_end },
      { page: 1, str: "1,014.30", x: 480, y: y_end },
    ];

    const text = layout_text_from_items(items);
    const corpus = statement_detection_corpus(text, {
      title: "Current Account Statement",
      author: "Maybank2u.com",
    });
    expect(mbb_savings_is_likely_statement(corpus)).toBe(true);

    const { rows, meta } = parse_mbb_savings_statement(text);
    expect(rows).toHaveLength(2);
    expect(meta.opening_balance_major).toBe("1000.00");
    expect(meta.ending_balance_major).toBe("1014.30");
    const card = rows.find((r) => r.txn_type === "cc_payment");
    expect(card?.description).toContain("MAYBANK VISA CARD");
    expect(card?.amount_major).toBe("10.70");
    expect(rows.every((r) => r.status === "new")).toBe(true);
  });
});