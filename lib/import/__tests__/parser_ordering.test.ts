import { describe, expect, it } from "vitest";
import { parse_statement_text, select_statement_parser } from "@/lib/import/parsers";
import { statement_detection_corpus } from "@/lib/import/statement_detection";

const MAYBANK_SAVINGS_PDFJS_SNIPPET = `
Maybank Islamic
URUSNIAGA AKAUN ACCOUNT TRANSACTIONS
ENTRY DATE  VALUE DATE  STATEMENT BALANCE
TARIKH PENYATA 31/10/26
BEGINNING BALANCE 500.00
03/10  PAYMENT FR A/C  12.00-  488.00
ENDING BALANCE 488.00
`;

describe("statement parser ordering", () => {
  it("routes Maybank current-account text to mbb_savings, not generic maybank", () => {
    const meta = {
      title: "Current Account Statement",
      author: "Maybank2u.com",
      creator: "Maybank2u.com",
    };
    const corpus = statement_detection_corpus(
      MAYBANK_SAVINGS_PDFJS_SNIPPET,
      meta,
    );
    const parser = select_statement_parser(corpus, "PBE_SAVINGS", meta);
    expect(parser.id).toBe("mbb_savings");

    const out = parse_statement_text(
      MAYBANK_SAVINGS_PDFJS_SNIPPET,
      "PBE_SAVINGS",
      meta,
    );
    expect(out.parser_id).toBe("mbb_savings");
    expect(out.rows.length).toBeGreaterThan(0);
    expect(out.parse_warning).toBeNull();
  });

  it("routes Public Bank savings text to pbe_savings, not pbe card", () => {
    const text = `
PUBLIC BANK BERHAD
PENYATA AKAUN / STATEMENT OF ACCOUNT
Tarikh Penyata / Statement Date   20 Nov 2026
Balance From Last Statement 20.00
23/10  SAMPLE DEBIT   5.00   15.00
`;
    const meta = { creator: "Public Bank Berhad" };
    const parser = select_statement_parser(text, "PBE_SAVINGS", meta);
    expect(parser.id).toBe("pbe_savings");
    const out = parse_statement_text(text, "PBE_SAVINGS", meta);
    expect(out.parser_id).toBe("pbe_savings");
    expect(out.rows.length).toBe(1);
  });

  it("routes Hong Leong savings text to hlb_savings, not hlb stub", () => {
    const text = `
Hong Leong Bank Berhad
BASIC SAVINGS ACCOUNT STATEMENT
Date / Tarikh : 31-10-2026
Date  Transaction Description                    Deposit  Withdrawal  Balance
Balance from previous statement   10.00
01-10-2026  Sample withdrawal  1.00
`;
    const meta = { author: "CheckFree i-Solutions" };
    expect(
      select_statement_parser(text, "HLB", meta).id,
    ).toBe("hlb_savings");
    const out = parse_statement_text(text, "HLB", meta);
    expect(out.parser_id).toBe("hlb_savings");
    expect(out.rows.length).toBe(1);
  });

  it("routes TNG wallet PDF history to tng_wallet, not tng_text", () => {
    const text = `
TNG WALLET TRANSACTION HISTORY
Wallet ID 123
TNG WALLET TRANSACTION
1/11/2026 Success Reload 111 Quick Reload Payment (via GO+ Balance)   RM1.00   RM2.00
GO+ TRANSACTION
1/11/2026 Success GO+ Daily Earnings   RM0.0012   RM1.0012
`;
    const parser = select_statement_parser(text, "TNG_EWALLET");
    expect(parser.id).toBe("tng_wallet");
    const out = parse_statement_text(text, "TNG_EWALLET");
    expect(out.parser_id).toBe("tng_wallet");
    expect(out.rows.length).toBeGreaterThan(0);
  });

  it("returns a warning when maybank keyword parser matches but finds no rows", () => {
    const plain_maybank = "MAYBANK BERHAD\nRandom marketing flyer\nNo dates here";
    const out = parse_statement_text(plain_maybank, "PBE_SAVINGS");
    expect(out.parser_id).toBe("maybank");
    expect(out.rows).toHaveLength(0);
    expect(out.parse_warning).toMatch(/Maybank statement matched/);
  });
});