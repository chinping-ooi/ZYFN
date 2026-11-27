import { describe, expect, it } from "vitest";
import { layout_text_from_items } from "@/lib/import/pdf_layout";
import {
  mbb_savings_is_likely_statement,
  parse_mbb_savings_statement,
} from "@/lib/import/parsers/mbb_savings";
import { statement_detection_corpus } from "@/lib/import/statement_detection";

describe("mbb_savings upload detection regression", () => {
  it("returns account when layout matches but date is on a later pdfjs line", () => {
    const items = [
      { page: 1, str: "Maybank2u.com", x: 40, y: 800 },
      { page: 1, str: "CURRENT", x: 40, y: 780 },
      { page: 1, str: "ACCOUNT", x: 100, y: 780 },
      { page: 1, str: "STATEMENT", x: 165, y: 780 },
      { page: 1, str: "URUSNIAGA", x: 40, y: 760 },
      { page: 1, str: "AKAUN", x: 120, y: 760 },
      { page: 1, str: "TARIKH", x: 40, y: 740 },
      { page: 1, str: "PENYATA", x: 95, y: 740 },
      { page: 1, str: ":", x: 155, y: 740 },
      { page: 1, str: "31/10/2026", x: 170, y: 740 },
      { page: 1, str: "BEGINNING", x: 40, y: 720 },
      { page: 1, str: "BALANCE", x: 120, y: 720 },
      { page: 1, str: "100.00", x: 400, y: 720 },
    ];
    const text = layout_text_from_items(items);
    const corpus = statement_detection_corpus(text, {
      creator: "Maybank PDF",
    });
    expect(mbb_savings_is_likely_statement(corpus)).toBe(true);
    const parsed = parse_mbb_savings_statement(text);
    expect(parsed.account?.account_ref).toBe("MBB_SAVINGS");
    expect(parsed.meta.statement_date_iso).toBe("2026-10-31");
  });

  it("still exposes account for auto-detect when only TARIKH date is missing", () => {
    const text = `
Maybank2u.com
CURRENT ACCOUNT STATEMENT
URUSNIAGA AKAUN / ACCOUNT TRANSACTIONS
BEGINNING BALANCE 50.00
03/10  SAMPLE 10.00- 40.00
`;
    expect(mbb_savings_is_likely_statement(text)).toBe(true);
    const parsed = parse_mbb_savings_statement(text);
    expect(parsed.account?.account_ref).toBe("MBB_SAVINGS");
    expect(parsed.rows).toHaveLength(0);
    expect(parsed.parse_warning).toMatch(/statement date/i);
  });
});