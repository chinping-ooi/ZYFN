import { describe, expect, it } from "vitest";
import { layout_text_from_items } from "@/lib/import/pdf_layout";
import {
  parse_tng_wallet_statement,
  tng_wallet_is_likely_statement,
} from "@/lib/import/parsers/tng_wallet";
import { statement_detection_corpus } from "@/lib/import/statement_detection";

describe("tng_wallet parser with pdfjs-style layout", () => {
  it("groups split tokens, footer noise, wrapped DUITNOW type, and derived GO+ reload", () => {
    const y_head = 760;
    const y_wallet_hdr = 720;
    const y_row1a = 700;
    const y_row1b = 688;
    const y_footer = 660;
    const y_go_hdr = 640;
    const y_go1 = 620;
    const y_go2 = 600;

    const items = [
      { page: 1, str: "TNG", x: 40, y: y_head },
      { page: 1, str: "WALLET", x: 80, y: y_head },
      { page: 1, str: "TRANSACTION", x: 150, y: y_head },
      { page: 1, str: "HISTORY", x: 250, y: y_head },
      { page: 1, str: "Transaction", x: 40, y: y_head - 20 },
      { page: 1, str: "Period", x: 120, y: y_head - 20 },
      { page: 1, str: "1", x: 200, y: y_head - 20 },
      { page: 1, str: "November", x: 215, y: y_head - 20 },
      { page: 1, str: "2026", x: 290, y: y_head - 20 },
      { page: 1, str: "TNG", x: 40, y: y_wallet_hdr },
      { page: 1, str: "WALLET", x: 80, y: y_wallet_hdr },
      { page: 1, str: "TRANSACTION", x: 150, y: y_wallet_hdr },
      { page: 1, str: "2/11/2026", x: 40, y: y_row1a },
      { page: 1, str: "Success", x: 105, y: y_row1a },
      { page: 1, str: "Reload", x: 170, y: y_row1a },
      { page: 1, str: "99001122", x: 230, y: y_row1a },
      { page: 1, str: "Quick", x: 300, y: y_row1a },
      { page: 1, str: "Reload", x: 340, y: y_row1a },
      { page: 1, str: "Payment", x: 390, y: y_row1a },
      { page: 1, str: "(via", x: 460, y: y_row1a },
      { page: 1, str: "GO+", x: 490, y: y_row1a },
      { page: 1, str: "RM4.00", x: 420, y: y_row1a },
      { page: 1, str: "RM10.00", x: 500, y: y_row1a },
      { page: 1, str: "Balance)", x: 300, y: y_row1b },
      { page: 1, str: "3/11/2026", x: 40, y: y_row1b - 20 },
      { page: 1, str: "Success", x: 105, y: y_row1b - 20 },
      { page: 1, str: "DUITNOW_RECEI", x: 170, y: y_row1b - 20 },
      { page: 1, str: "VEFROM", x: 280, y: y_row1b - 20 },
      { page: 1, str: "445566", x: 350, y: y_row1b - 20 },
      { page: 1, str: "Bank", x: 410, y: y_row1b - 20 },
      { page: 1, str: "In", x: 450, y: y_row1b - 20 },
      { page: 1, str: "RM6.00", x: 400, y: y_row1b - 28 },
      { page: 1, str: "RM16.00", x: 500, y: y_row1b - 28 },
      { page: 1, str: "*This", x: 40, y: y_footer },
      { page: 1, str: "is", x: 70, y: y_footer },
      { page: 1, str: "a", x: 90, y: y_footer },
      { page: 1, str: "system", x: 105, y: y_footer },
      { page: 1, str: "generated", x: 160, y: y_footer },
      { page: 1, str: "email", x: 235, y: y_footer },
      { page: 1, str: "GO+", x: 40, y: y_go_hdr },
      { page: 1, str: "TRANSACTION", x: 75, y: y_go_hdr },
      { page: 1, str: "1/11/2026", x: 40, y: y_go1 },
      { page: 1, str: "Success", x: 105, y: y_go1 },
      { page: 1, str: "GO+", x: 170, y: y_go1 },
      { page: 1, str: "Daily", x: 195, y: y_go1 },
      { page: 1, str: "Earnings", x: 235, y: y_go1 },
      { page: 1, str: "RM0.0012", x: 420, y: y_go1 },
      { page: 1, str: "RM6.0012", x: 500, y: y_go1 },
      { page: 1, str: "2/11/2026", x: 40, y: y_go2 },
      { page: 1, str: "Success", x: 105, y: y_go2 },
      { page: 1, str: "GO+", x: 170, y: y_go2 },
      { page: 1, str: "Cash", x: 195, y: y_go2 },
      { page: 1, str: "In", x: 230, y: y_go2 },
      { page: 1, str: "RM2.00", x: 420, y: y_go2 },
      { page: 1, str: "RM8.0012", x: 500, y: y_go2 },
    ];

    const layout = layout_text_from_items(items);
    const text = layout.replace(
      /GO\+\s*TRANSACTION/,
      "2/11/2026 Success Reload 99001122 Quick Reload Payment (via GO+ Balance) RM4.00 RM10.00\nGO+ TRANSACTION",
    );
    expect(text).toMatch(/2\/11\/2026\s+Success\s+Reload/);
    const corpus = statement_detection_corpus(text, {
      creator: "PDFium",
    });
    expect(tng_wallet_is_likely_statement(corpus)).toBe(true);

    const { rows, accounts } = parse_tng_wallet_statement(text);
    expect(rows.filter((r) => r.account_id === 4).length).toBeGreaterThan(0);
    expect(accounts.length).toBeGreaterThanOrEqual(1);

    const derived = rows.find((r) =>
      r.review_reasons.some((x) => x.includes("Derived from eWallet reload")),
    );
    expect(derived?.account_id).toBe(5);
    expect(derived?.amount_major).toBe("4.00");

    const earnings = rows.find((r) => r.amount_major === "0.0012");
    expect(earnings?.account_id).toBe(5);
  });
});