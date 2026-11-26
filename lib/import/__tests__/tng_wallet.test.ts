import { describe, expect, it } from "vitest";
import {
  parse_tng_wallet_statement,
  tng_wallet_is_likely_statement,
} from "@/lib/import/parsers/tng_wallet";
import { parse_statement_text, select_statement_parser } from "@/lib/import/parsers";

const LAYOUT_FIXTURE = `
TNG WALLET TRANSACTION HISTORY
Registered Name  Sample User
Wallet ID  1234567890
Account Status  Active
Generated Date & Time 26 November 2026 12:11 PM
Transaction Period 1 November 2026 - 15 November 2026

TNG WALLET TRANSACTION
Date Status Transaction Type Reference Description Details Amount (RM) Wallet Balance

1/11/2026 Success Reload 8811223344 Quick Reload Payment (via GO+   665544332211   RM7.99   RM15.19
Balance) TNGOW3MY1

7/11/2026 Success RFID Payment 99110022 Toll SAMPLE   07/11/2026 08:28 AM   RM2.50   RM12.69

10/11/2026 Success Payment 44556677   GWP-SHOP-001   RM5.00   RM7.69

15/11/2026 Success DUITNOW_RECEI VEFROM 55667788 Sample Bank Transfer   RM20.00   RM27.69

*This is a system generated email. Do not reply. +603 5022 3888 Thank you.

GO+ TRANSACTION
Date Status Transaction Type Reference Description Details Amount (RM) GO+ Balance

1/11/2026 Success GO+ Cash In 11223344 eWallet Cash Out Via eWallet to GO+   RM3.00   RM15.15

5/11/2026 Success GO+ Daily Earnings 22334455   RM0.0012   RM15.1512

11/11/2026 Success GO+ Cash In 33445566   RM2.00   RM7.16
`;

describe("tng_wallet layout parser", () => {
  it("parses a single wallet reload row with inline RM pair", () => {
    const mini = `
TNG WALLET TRANSACTION HISTORY
TNG WALLET TRANSACTION
1/11/2026 Success Reload 8811223344 Quick Reload Payment (via GO+   665544332211   RM7.99   RM15.19
Balance) TNGOW3MY1
`;
    const { rows } = parse_tng_wallet_statement(mini);
    expect(rows.filter((r) => r.account_id === 4)).toHaveLength(1);
    expect(rows.find((r) => r.account_id === 4)?.amount_major).toBe("7.99");
  });

  it("detects PDF transaction history and parses both sections", () => {
    expect(tng_wallet_is_likely_statement(LAYOUT_FIXTURE)).toBe(true);
    const { rows, accounts } = parse_tng_wallet_statement(LAYOUT_FIXTURE);
    expect(accounts).toHaveLength(2);
    expect(accounts.map((a) => a.account_ref).sort()).toEqual([
      "TNG_EWALLET",
      "TNG_GO_PLUS",
    ]);

    const wallet = rows.filter((r) => r.account_id === 4);
    const go = rows.filter((r) => r.account_id === 5);
    expect(wallet.map((r) => r.amount_major)).toContain("7.99");
    expect(wallet.length).toBeGreaterThanOrEqual(4);
    expect(go.length).toBeGreaterThanOrEqual(2);

    const reload = wallet.find((r) => r.amount_major === "7.99");
    expect(reload).toBeDefined();
    expect(reload?.txn_type).toBe("Reload");
    expect(reload?.description.toLowerCase()).toContain("go+");

    const derived = go.find((r) =>
      r.review_reasons.some((x) => x.includes("Derived from eWallet reload")),
    );
    expect(derived).toBeDefined();
    expect(derived?.direction).toBe("out");
    expect(derived?.amount_major).toBe("7.99");

    const earnings = go.find((r) => r.txn_type === "GO+ Daily Earnings");
    expect(earnings?.amount_major).toBe("0.0012");

    const rfid = wallet.find((r) => /Toll/i.test(r.description));
    expect(rfid?.txn_at).toContain("T08:28:00Z");

    const duit = wallet.find((r) => r.detail === "55667788");
    expect(duit?.txn_type).toBe("DUITNOW_RECEIVEFROM");
  });

  it("wins parser ordering over tng_text for transaction history PDFs", () => {
    const parser = select_statement_parser(LAYOUT_FIXTURE, "PBE_SAVINGS");
    expect(parser.id).toBe("tng_wallet");
    const out = parse_statement_text(LAYOUT_FIXTURE, "TNG_EWALLET");
    expect(out.parser_id).toBe("tng_wallet");
    expect(out.parsed_accounts?.length).toBe(2);
    expect(out.rows.length).toBeGreaterThan(0);
  });
});