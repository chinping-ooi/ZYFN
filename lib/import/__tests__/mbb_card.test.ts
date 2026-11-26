import { describe, expect, it } from "vitest";
import { parse_mbb_card_statement } from "@/lib/import/parsers/mbb_card";

/** Synthetic Maybank combined card statement — no real cardholder data. */
const SYNTHETIC_MBB_COMBINED = `
STATEMENT OF CREDIT CARD ACCOUNT
PENYATA AKAUN KAD KREDIT
Malayan Banking Berhad
Maybank2U.com
Statement Date/ Tarikh Penyata Payment Due Date/
06 NOV 26    26 NOV 26
Posting Date / Transaction Date / Transaction Description / Amount(RM)
JANE DOE TEST
MAYBANK 2 GOLD VISA       :   4000 0000 0000 0001
YOUR COMBINED CREDIT LIMIT (RM)  10,000
YOUR PREVIOUS STATEMENT BALANCE   0.00
07/10   07/10   CAFE ALPHA   PENANG   MY   12.35
08/10   08/10   SHOP BETA   KL   MY   45.00
09/10   09/10   MART GAMMA   MY   22.10
10/10   10/10   STORE DELTA   MY   80.00
05/11   05/11   PYMT@MAYBANK2U.COM   100.00CR
04/11   04/11   PYMT@MAYBANK2U.COM   59.45CR
TOTAL CREDIT THIS MONTH  159.45
TOTAL DEBIT THIS MONTH  159.45
SUB TOTAL/JUMLAH  0.00
JANE DOE TEST
MAYBANK 2 GOLD AMEX : 3700 000000 00001
YOUR COMBINED CREDIT LIMIT (RM)  15,000
YOUR PREVIOUS STATEMENT BALANCE   75.33
01/10   01/10   RETAIL ONE   MY   10.00
02/10   02/10   RETAIL TWO   MY   20.00
03/10   03/10   RETAIL THREE   MY   15.50
04/10   04/10   RETAIL FOUR   MY   8.20
05/10   05/10   RETAIL FIVE   MY   12.00
06/10   06/10   RETAIL SIX   MY   30.00
07/10   07/10   RETAIL SEVEN   MY   5.00
08/10   08/10   RETAIL EIGHT   MY   18.75
09/10   09/10   RETAIL INTEREST RATE = 15.00%
10/10   10/10   PYMT@MAYBANK2U.COM   50.00CR
11/10   11/10   PYMT@MAYBANK2U.COM   25.00CR
12/10   12/10   CASH REBATE PROGRAM   5.00CR
TOTAL CREDIT THIS MONTH  80.00
TOTAL DEBIT THIS MONTH  119.45
SUB TOTAL/JUMLAH  114.78
TREATS POINTS SUMMARY
4000 0000 0000 0001   1000
3700 000000 00001   500
`;

describe("parse_mbb_card_statement", () => {
  it("splits a combined PDF into two account row sets", () => {
    const result = parse_mbb_card_statement(SYNTHETIC_MBB_COMBINED);
    expect(result.accounts.map((a) => a.account_id).sort()).toEqual([8, 9]);
    expect(result.rows.length).toBe(17);
    const visa = result.rows.filter((r) => r.account_id === 8);
    const amex = result.rows.filter((r) => r.account_id === 9);
    expect(visa).toHaveLength(6);
    expect(amex).toHaveLength(11);
  });

  it("classifies payments, purchases, and rebate credits", () => {
    const { rows } = parse_mbb_card_statement(SYNTHETIC_MBB_COMBINED);
    expect(
      rows.some(
        (r) =>
          r.txn_type === "cc_payment" &&
          /PYMT@MAYBANK2U/i.test(r.description),
      ),
    ).toBe(true);
    expect(rows.filter((r) => r.txn_type === "purchase").length).toBe(12);
    expect(
      rows.filter((r) => r.account_id === 8 && r.txn_type === "purchase").length,
    ).toBe(4);
    expect(
      rows.find((r) => /CASH REBATE/i.test(r.description))?.txn_type,
    ).toBe("refund");
  });

  it("reconciles card one to zero closing and card two to non-zero", () => {
    const { rows } = parse_mbb_card_statement(SYNTHETIC_MBB_COMBINED);
    const visa_close = rows
      .filter((r) => r.account_id === 8)
      .sort((a, b) => a.txn_at.localeCompare(b.txn_at))
      .at(-1)?.balance_after_major;
    expect(visa_close).toBe("0.00");
    const amex_close = rows
      .filter((r) => r.account_id === 9)
      .sort((a, b) => a.txn_at.localeCompare(b.txn_at))
      .at(-1)?.balance_after_major;
    expect(amex_close).toBe("114.78");
  });

  it("skips interest-rate info lines without amounts", () => {
    const { rows } = parse_mbb_card_statement(SYNTHETIC_MBB_COMBINED);
    expect(rows.some((r) => /INTEREST RATE/i.test(r.description))).toBe(false);
  });

  it("ignores TreatsPoints tables after card sections", () => {
    const { rows } = parse_mbb_card_statement(SYNTHETIC_MBB_COMBINED);
    expect(rows.some((r) => /TREATS/i.test(r.description))).toBe(false);
    expect(rows.some((r) => /POINTS/i.test(r.description))).toBe(false);
  });
});