import { describe, expect, it } from "vitest";
import {
  parse_pbe_savings_statement,
  pbe_savings_is_likely_statement,
} from "@/lib/import/parsers/pbe_savings";
import { statement_detection_corpus } from "@/lib/import/statement_detection";

const SYNTHETIC_PBE_SAVINGS = `
Public Bank Berhad
PENYATA AKAUN / STATEMENT OF ACCOUNT
Jenis Akaun / Account Type   RM Cm Savings Acct-i
Tarikh Penyata / Statement Date   20 Nov 2026
Baki Penutup / Closing Balance 95.00
Jumlah Debit / Total Debits 14.00
Bil. Debit / No. of Debits 3
Jumlah Kredit / Total Credits 9.00
Bil. Kredit / No. of Credits 2
TARIKH URUS NIAGA DEBIT KREDIT BAKI
DATE TRANSACTION DEBIT CREDIT BALANCE
Balance From Last Statement 100.00
23/10  DUITNOW QR DR 770130 SAMPLE NAME   10.00   90.00
     QR REF NO SYNTH-REF-001
     FUND TRANSFER DETAIL
01/11  TRANSFER IN SAMPLE   5.00   95.00
CR CARD PYMT-ATM/EFT 336577   4.00   99.00
SST DR MISC HANDLING CHRG   0.00   99.00
05/11  FINAL DEBIT SAMPLE   4.00   95.00
Balance C/F
Muka Surat 1 Daripada 2
Balance B/F
Page 2 of 2
PERHATIAN / ATTENTION
Closing Balance In This Statement 95.00
`;

const SYNTHETIC_DEC_JAN = `
PENYATA AKAUN / STATEMENT OF ACCOUNT
Tarikh Penyata / Statement Date   20 Jan 2027
Balance From Last Statement 50.00
15/12  YEAR ROLL DEBIT   5.00   45.00
05/01  YEAR ROLL CREDIT   5.00   50.00
Baki Penutup / Closing Balance 50.00
`;

describe("pbe_savings parser", () => {
  it("detects savings statements but not card statements", () => {
    const corpus = statement_detection_corpus(SYNTHETIC_PBE_SAVINGS, {
      creator: "Public Bank Berhad",
    });
    expect(pbe_savings_is_likely_statement(corpus)).toBe(true);
    expect(
      pbe_savings_is_likely_statement(
        "PENYATA KAD / CARD STATEMENT\nPUBLIC BANK BERHAD",
      ),
    ).toBe(false);
  });

  it("parses dated and undated rows, continuations, and account id 1", () => {
    const { rows, account, meta } = parse_pbe_savings_statement(
      SYNTHETIC_PBE_SAVINGS,
    );
    expect(account?.account_id).toBe(1);
    expect(meta.opening_balance_major).toBe("100.00");
    expect(meta.closing_balance_major).toBe("95.00");
    expect(rows.length).toBeGreaterThanOrEqual(5);

    const qr = rows.find((r) => r.description.includes("DUITNOW QR"));
    expect(qr?.description).toContain("SYNTH-REF-001");
    expect(qr?.direction).toBe("out");

    const undated_card = rows.find((r) => r.txn_type === "cc_payment");
    expect(undated_card?.txn_at.startsWith("2026-11-01")).toBe(true);
    expect(undated_card?.amount_major).toBe("4.00");

    const zero_fee = rows.find((r) => r.amount_major === "0.00");
    expect(zero_fee?.txn_type).toBe("fee");
    expect(rows.every((r) => r.status === "new")).toBe(true);
  });

  it("assigns previous calendar year to December rows on a January statement", () => {
    const { rows } = parse_pbe_savings_statement(SYNTHETIC_DEC_JAN);
    const dec = rows.find((r) => r.description.includes("YEAR ROLL DEBIT"));
    const jan = rows.find((r) => r.description.includes("YEAR ROLL CREDIT"));
    expect(dec?.txn_at.startsWith("2026-12-15")).toBe(true);
    expect(jan?.txn_at.startsWith("2027-01-05")).toBe(true);
  });
});