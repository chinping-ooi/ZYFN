import { describe, expect, it } from "vitest";
import { layout_text_from_items } from "@/lib/import/pdf_layout";
import {
  hlb_savings_is_likely_statement,
  parse_hlb_savings_statement,
} from "@/lib/import/parsers/hlb_savings";
import { statement_detection_corpus } from "@/lib/import/statement_detection";

describe("hlb_savings parser with pdfjs-style layout", () => {
  it("uses per-page column offsets and page-split continuations", () => {
    const y_hdr = 760;
    const y_cols_p1 = 700;
    const y_open = 680;
    const y_t1 = 660;
    const y_t1c = 645;
    const y_foot = 620;
    const y_hdr2 = 760;
    const y_cols_p2 = 695;
    const y_t1c2 = 660;

    const x_date = 36;
    const x_desc = 95;
    const x_dep = 300;
    const x_wdr = 360;
    const x_bal = 430;

    const items = [
      { page: 1, str: "BASIC", x: 40, y: y_hdr },
      { page: 1, str: "SAVINGS", x: 90, y: y_hdr },
      { page: 1, str: "ACCOUNT", x: 150, y: y_hdr },
      { page: 1, str: "STATEMENT", x: 210, y: y_hdr },
      { page: 1, str: "Date", x: 40, y: y_hdr - 18 },
      { page: 1, str: "31-10-2026", x: 120, y: y_hdr - 18 },
      { page: 1, str: "Date", x: x_date, y: y_cols_p1 },
      { page: 1, str: "Deposit", x: x_dep, y: y_cols_p1 },
      { page: 1, str: "Withdrawal", x: x_wdr, y: y_cols_p1 },
      { page: 1, str: "Balance", x: x_bal, y: y_cols_p1 },
      { page: 1, str: "Balance", x: 40, y: y_open },
      { page: 1, str: "from", x: 95, y: y_open },
      { page: 1, str: "previous", x: 130, y: y_open },
      { page: 1, str: "statement", x: 195, y: y_open },
      { page: 1, str: "20.00", x: x_bal, y: y_open },
      { page: 1, str: "01-10-2026", x: x_date, y: y_t1 },
      { page: 1, str: "DuitNow", x: x_desc, y: y_t1 },
      { page: 1, str: "QR", x: x_desc + 55, y: y_t1 },
      { page: 1, str: "2.00", x: x_wdr, y: y_t1 },
      { page: 1, str: "QR", x: x_desc, y: y_t1c },
      { page: 1, str: "Payment", x: x_desc + 25, y: y_t1c },
      { page: 1, str: "999_7", x: 40, y: y_foot },
      { page: 1, str: "1", x: 80, y: y_foot },
      { page: 2, str: "Hong", x: 40, y: y_hdr2 },
      { page: 2, str: "Leong", x: 85, y: y_hdr2 },
      { page: 2, str: "Bank", x: 130, y: y_hdr2 },
      { page: 2, str: "Date", x: x_date, y: y_cols_p2 },
      { page: 2, str: "Deposit", x: x_dep + 8, y: y_cols_p2 },
      { page: 2, str: "Withdrawal", x: x_wdr + 5, y: y_cols_p2 },
      { page: 2, str: "Balance", x: x_bal, y: y_cols_p2 },
      { page: 2, str: "SYNTH", x: x_desc, y: y_t1c2 },
      { page: 2, str: "MEMO", x: x_desc + 45, y: y_t1c2 },
      { page: 2, str: "01-10-2026", x: x_date, y: y_t1c2 - 25 },
      { page: 2, str: "Day", x: x_desc, y: y_t1c2 - 25 },
      { page: 2, str: "end", x: x_desc + 30, y: y_t1c2 - 25 },
      { page: 2, str: "10.00", x: x_dep + 8, y: y_t1c2 - 25 },
      { page: 2, str: "28.00", x: x_bal, y: y_t1c2 - 25 },
      { page: 2, str: "Closing", x: 40, y: y_t1c2 - 40 },
      { page: 2, str: "Balance", x: 95, y: y_t1c2 - 40 },
      { page: 2, str: "28.00", x: x_bal, y: y_t1c2 - 40 },
    ];

    const text = layout_text_from_items(items);
    const corpus = statement_detection_corpus(text, {
      author: "CheckFree i-Solutions",
    });
    expect(hlb_savings_is_likely_statement(corpus)).toBe(true);

    const { rows, meta } = parse_hlb_savings_statement(text);
    expect(meta.opening_balance_major).toBe("20.00");
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.description.includes("DuitNow"))?.detail).toMatch(
      /SYNTH MEMO/,
    );
    expect(rows.find((r) => r.balance_after_major === "28.00")).toBeTruthy();
  });
});