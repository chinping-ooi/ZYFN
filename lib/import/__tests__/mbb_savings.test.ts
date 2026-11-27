import { describe, expect, it } from "vitest";
import {
  mbb_savings_is_likely_statement,
  parse_mbb_savings_statement,
} from "@/lib/import/parsers/mbb_savings";

const SYNTHETIC_MBB_SAVINGS = `
Maybank2u.com
Current Account Statement
URUSNIAGA AKAUN/ ACCOUNT TRANSACTIONS
ENTRY DATE  VALUE DATE  TRANSACTION DESCRIPTION  TRANSACTION AMOUNT  STATEMENT BALANCE
TARIKH PENYATA : 31/10/26
BEGINNING BALANCE   2,930.22
  03/10   PAYMENT FR A/C   10.70-   2,919.52
     MAYBANK VISA CARD *
     XXXX-XXXX-XXXX-1234
     DUITNOW QR
  05/10   TRANSFER TO A/C   50.00+   2,969.52
     Fund transfer
ENTRY DATE  VALUE DATE  TRANSACTION DESCRIPTION  TRANSACTION AMOUNT  STATEMENT BALANCE
  12/10   INTEREST CREDIT   5.00+   2,974.52
Perhatian / Note
PIDM member
BAKI LEGAR
LEDGER BALANCE   2,974.52
ENDING BALANCE   2,974.52
`;

const SYNTHETIC_DR_BALANCE = `
Maybank2u.com
Current Account Statement
URUSNIAGA AKAUN/ ACCOUNT TRANSACTIONS
ENTRY DATE  VALUE DATE  TRANSACTION DESCRIPTION  TRANSACTION AMOUNT  STATEMENT BALANCE
TARIKH PENYATA : 31/10/26
BEGINNING BALANCE   100.00
  01/10   SAMPLE DEBIT   50.00-   50.00
  02/10   OVERDRAFT USE   150.00-   100.00 DR
ENDING BALANCE   -100.00
`;

const SYNTHETIC_MISMATCH = `
Maybank2u.com
Current Account Statement
URUSNIAGA AKAUN/ ACCOUNT TRANSACTIONS
ENTRY DATE  VALUE DATE  TRANSACTION DESCRIPTION  TRANSACTION AMOUNT  STATEMENT BALANCE
TARIKH PENYATA : 31/10/26
BEGINNING BALANCE   100.00
  01/10   SAMPLE PAYMENT   10.00-   90.00
ENDING BALANCE   85.00
`;

describe("mbb_savings parser", () => {
  it("detects savings statements separately from card PDFs", () => {
    expect(mbb_savings_is_likely_statement(SYNTHETIC_MBB_SAVINGS)).toBe(true);
    expect(
      mbb_savings_is_likely_statement(
        "STATEMENT OF CREDIT CARD ACCOUNT\nMaybank2u.com",
      ),
    ).toBe(false);
  });

  it("parses signed amounts, multiline descriptions, and account id 3", () => {
    const { rows, account, meta } = parse_mbb_savings_statement(
      SYNTHETIC_MBB_SAVINGS,
    );
    expect(account?.account_id).toBe(3);
    expect(rows).toHaveLength(3);
    expect(meta.opening_balance_major).toBe("2930.22");
    expect(meta.ending_balance_major).toBe("2974.52");

    const card_payment = rows.find((r) => r.txn_type === "cc_payment");
    expect(card_payment?.direction).toBe("out");
    expect(card_payment?.description).toContain("MAYBANK VISA CARD");
    expect(card_payment?.description).toContain("DUITNOW QR");

    const transfer_in = rows.find((r) => r.txn_type === "transfer" && r.direction === "in");
    expect(transfer_in?.amount_major).toBe("50.00");
  });

  it("skips page header/footer noise between transaction rows", () => {
    const { rows } = parse_mbb_savings_statement(SYNTHETIC_MBB_SAVINGS);
    expect(rows.some((r) => /PIDM|LEDGER/i.test(r.description))).toBe(false);
    expect(rows.some((r) => r.txn_at.startsWith("2026-10-12"))).toBe(true);
  });

  it("parses DR suffix as negative running balance", () => {
    const { rows } = parse_mbb_savings_statement(SYNTHETIC_DR_BALANCE);
    const overdrawn = rows.find((r) => r.txn_at.startsWith("2026-10-02"));
    expect(overdrawn?.balance_after_major).toBe("-100.00");
    expect(rows.every((r) => r.status === "new")).toBe(true);
  });

  it("flags reconciliation failure when ending balance mismatches", () => {
    const { rows } = parse_mbb_savings_statement(SYNTHETIC_MISMATCH);
    expect(rows.some((r) => r.status === "needs_review")).toBe(true);
    expect(
      rows.some((r) =>
        r.review_reasons.some((reason) => reason.includes("mismatch")),
      ),
    ).toBe(true);
  });
});