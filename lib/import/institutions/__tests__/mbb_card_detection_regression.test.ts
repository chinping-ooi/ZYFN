import { describe, expect, it } from "vitest";
import { layout_text_from_items } from "@/lib/import/pdf_layout";
import { parse_mbb_card_statement } from "@/lib/import/parsers/mbb_card";

describe("mbb_card upload detection regression", () => {
  it("detects card accounts when header date uses a four-digit year on pdfjs lines", () => {
    const items = [
      { page: 1, str: "STATEMENT", x: 40, y: 800 },
      { page: 1, str: "OF", x: 120, y: 800 },
      { page: 1, str: "CREDIT", x: 145, y: 800 },
      { page: 1, str: "CARD", x: 210, y: 800 },
      { page: 1, str: "ACCOUNT", x: 250, y: 800 },
      { page: 1, str: "Statement", x: 40, y: 780 },
      { page: 1, str: "Date", x: 110, y: 780 },
      { page: 1, str: "06", x: 200, y: 780 },
      { page: 1, str: "NOV", x: 225, y: 780 },
      { page: 1, str: "2026", x: 260, y: 780 },
      { page: 1, str: "JANE", x: 40, y: 760 },
      { page: 1, str: "DOE", x: 85, y: 760 },
      { page: 1, str: "MAYBANK", x: 40, y: 740 },
      { page: 1, str: "2", x: 110, y: 740 },
      { page: 1, str: "GOLD", x: 120, y: 740 },
      { page: 1, str: "VISA", x: 165, y: 740 },
    ];
    const text = layout_text_from_items(items);
    const { accounts, meta } = parse_mbb_card_statement(text);
    expect(meta.statement_date_iso).toBe("2026-11-06");
    expect(accounts.map((a) => a.account_ref)).toEqual(["MBB_VISA_1697"]);
  });

  it("returns card account chips when product is found but date is missing", () => {
    const text = `
STATEMENT OF CREDIT CARD ACCOUNT
Maybank2u.com
MAYBANK 2 GOLD VISA : 4000 0000 0000 0001
`;
    const { accounts, parse_warning } = parse_mbb_card_statement(text);
    expect(accounts).toHaveLength(1);
    expect(accounts[0]?.account_ref).toBe("MBB_VISA_1697");
    expect(parse_warning).toMatch(/statement date/i);
  });
});