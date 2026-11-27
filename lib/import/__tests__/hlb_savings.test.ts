import { describe, expect, it } from "vitest";
import {
  hlb_savings_is_likely_statement,
  parse_hlb_savings_statement,
} from "@/lib/import/parsers/hlb_savings";
import { statement_detection_corpus } from "@/lib/import/statement_detection";

const DEP = 48;
const WDR = 62;
const BAL = 76;

function column_header_line(): string {
  let line = "Date  Transaction Description";
  line = line.padEnd(DEP);
  line += "Deposit".padStart(10);
  line = line.padEnd(WDR);
  line += "Withdrawal".padStart(10);
  line = line.padEnd(BAL);
  line += "Balance".padStart(10);
  return line;
}

function txn_line(
  date: string,
  desc: string,
  deposit?: string,
  withdrawal?: string,
  balance?: string,
): string {
  let line = `${date}  ${desc}`;
  line = line.padEnd(DEP);
  if (deposit) line += deposit.padStart(10);
  line = line.padEnd(WDR);
  if (withdrawal) line += withdrawal.padStart(10);
  line = line.padEnd(BAL);
  if (balance) line += balance.padStart(10);
  return line;
}

const SYNTHETIC_HLB = `
Hong Leong Bank Berhad
BASIC SAVINGS ACCOUNT STATEMENT
Date / Tarikh : 31-10-2026
Statement Period / Tempoh Penyataan : 01/10/26 - 31/10/26
${column_header_line()}
Balance from previous statement   100.00
${txn_line("01-10-2026", "DuitNow QR", undefined, "2.30")}
QR Payment
QR REF SYNTH-HLBBMYKL030OQR99
${txn_line("01-10-2026", "Rent receipt", "50.00", undefined, "147.70")}
Total Withdrawals / Jumlah Pengeluaran : 1  2.30
Total Deposits / Jumlah Simpanan : 1  50.00
Closing Balance / Baki Akhir : 147.70
Important Notices / Notis Penting
`;

describe("hlb_savings parser", () => {
  it("detects savings statements via keywords and metadata corpus", () => {
    const corpus = statement_detection_corpus(SYNTHETIC_HLB, {
      author: "CheckFree i-Solutions",
      title: "Generated PDF Document",
    });
    expect(hlb_savings_is_likely_statement(corpus)).toBe(true);
  });

  it("parses multi-line rows, end-of-day balances, and account id 2", () => {
    const { rows, account, meta } = parse_hlb_savings_statement(SYNTHETIC_HLB);
    expect(account?.account_id).toBe(2);
    expect(meta.opening_balance_major).toBe("100.00");
    expect(meta.closing_balance_major).toBe("147.70");
    expect(rows.length).toBe(2);

    const qr = rows.find((r) => r.description === "DuitNow QR");
    expect(qr?.direction).toBe("out");
    expect(qr?.detail).toContain("SYNTH-HLBBMYKL030OQR99");
    expect(qr?.txn_type).toBe("payment");

    const eod = rows.find((r) => r.description === "Rent receipt");
    expect(eod?.balance_after_major).toBe("147.70");
    expect(rows.every((r) => r.status === "new")).toBe(true);
  });

  it("uses prior-year for December rows on a January statement", () => {
    const jan_stmt = `
BASIC SAVINGS ACCOUNT STATEMENT
Date / Tarikh : 31-01-2027
${column_header_line()}
Balance from previous statement   50.00
28-12-2026  Year-end debit  5.00
05-01-2027  New year credit  5.00  50.00
Closing Balance / Baki Akhir : 50.00
`;
    const { rows } = parse_hlb_savings_statement(jan_stmt);
    const dec = rows.find((r) => r.description === "Year-end debit");
    const jan = rows.find((r) => r.description === "New year credit");
    expect(dec?.txn_at.startsWith("2026-12-28")).toBe(true);
    expect(jan?.txn_at.startsWith("2027-01-05")).toBe(true);
  });
});