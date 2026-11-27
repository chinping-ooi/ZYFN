import { describe, expect, it } from "vitest";
import { parse_hlb_savings_statement } from "@/lib/import/parsers/hlb_savings";
import { validate_running_balance } from "@/lib/import/institutions/hlb_savings/validate";

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

/**
 * Synthetic last page mimicking the pdfjs-joined HLB layout: the summary
 * block and "Important Notices" follow the final transaction, and the notices
 * quote rates as "N.NN% p.a." on undated lines.
 */
const SYNTHETIC_FOOTER = [
  "Hong Leong Bank Berhad",
  "BASIC SAVINGS ACCOUNT STATEMENT",
  "Date / Tarikh : 31-10-2026",
  "Statement Period / Tempoh Penyataan : 01/10/26 - 31/10/26",
  column_header_line(),
  "Balance from previous statement   100.00",
  txn_line("30-10-2026", "DuitNow QR", undefined, "3.00"),
  "QR Payment",
  "SYNTHPAYEE",
  txn_line("30-10-2026", "DuitNow QR", undefined, "2.00", "95.00"),
  txn_line("31-10-2026", "SYNTH SALARY CREDIT", "40.00", undefined, "135.00"),
  "SYNTH MEMO",
  "SYNTH_7 3",
  "Total Withdrawals / Jumlah Pengeluaran : 2 5.00 Date / Tarikh : 31-10-2026",
  "Total Deposits / Jumlah Simpanan : 1 40.00 Closing Balance / Baki Akhir : 135.00",
  "Important Notices / Notis Penting:",
  "1) Effective 1 January 2026, the Synthetic Base Rate is 1.23% p.a. and Lending Rate is 4.56% p.a.",
  "Mulai 1 Januari 2026, Kadar Asas Sintetik ialah 1.23% setahun dan Kadar Pinjaman ialah 4.56% setahun.",
  "2) Synthetic notice line without amounts, fee of RM2 per statement.",
].join("\n");

describe("hlb_savings footer and notices", () => {
  it("stops the ledger at the summary block and ignores percentage rates", () => {
    const { rows, meta } = parse_hlb_savings_statement(SYNTHETIC_FOOTER);
    expect(meta.deposit_count).toBe(1);
    expect(meta.withdrawal_count).toBe(2);
    expect(rows).toHaveLength(3);
    expect(rows.filter((r) => r.direction === "out")).toHaveLength(2);
    expect(rows.filter((r) => r.direction === "in")).toHaveLength(1);
    expect(
      rows.some((r) => /Notice|Effective|Mulai|setahun/i.test(`${r.description} ${r.detail}`)),
    ).toBe(false);
    expect(rows.every((r) => r.status === "new")).toBe(true);
    validate_running_balance(rows, "asset");
    expect(rows.filter((r) => r.status === "needs_review")).toEqual([]);
  });
});