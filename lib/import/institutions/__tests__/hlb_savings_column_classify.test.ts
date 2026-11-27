import { describe, expect, it } from "vitest";
import { parse_hlb_savings_statement } from "@/lib/import/parsers/hlb_savings";
import { validate_running_balance } from "@/lib/import/institutions/hlb_savings/validate";

/** Column-aligned text (pdftotext -layout style), synthetic values only. */
const DEP = 60;
const WDR = 78;
const BAL = 98;

function header(): string {
  let line = "    Date        Transaction Description";
  line = line.padEnd(DEP) + "Deposit";
  line = line.padEnd(WDR) + "Withdrawal";
  line = line.padEnd(BAL) + "Balance";
  return line;
}

/** Amounts right-aligned under their header (end at header start + 10). */
function txn(date: string, desc: string, dep?: string, wdr?: string, bal?: string): string {
  let line = ` ${date}   ${desc}`;
  line = line.padEnd(DEP - 3);
  line += (dep ?? "").padStart(10);
  line = line.padEnd(WDR - 0);
  line += (wdr ?? "").padStart(10);
  line = line.padEnd(BAL);
  line += (bal ?? "").padStart(10);
  return line;
}

const TEXT = [
  "Hong Leong Bank Berhad",
  "BASIC SAVINGS ACCOUNT STATEMENT",
  "Date / Tarikh : 31-10-2026",
  "Statement Period / Tempoh Penyataan : 01/10/26 - 31/10/26",
  header(),
  "              Balance from previous statement                                                    100.00",
  // Withdrawal whose headline has no "out" keyword and no balance on its line.
  txn("05-10-2026", "SYNTH CARD PURCHASE", undefined, "12.00"),
  "              SYNTH MERCHANT",
  txn("05-10-2026", "SYNTH SALARY CREDIT", "30.00", undefined, "118.00"),
  txn("06-10-2026", "SYNTH BILL PAYMENT", undefined, "8.00"),
  txn("06-10-2026", "SYNTH TRANSFER RECEIVED", "5.00", undefined, "115.00"),
  " Total Withdrawals / Jumlah Pengeluaran :   2   20.00",
  " Total Deposits / Jumlah Simpanan :   2   35.00   Closing Balance / Baki Akhir : 115.00",
].join("\n");

describe("hlb_savings column classification on aligned layouts", () => {
  it("reads deposit vs withdrawal from the column, not from squashed text", () => {
    const { rows } = parse_hlb_savings_statement(TEXT);
    expect(rows).toHaveLength(4);
    const by_desc = (s: string) => rows.find((r) => r.description.includes(s));
    expect(by_desc("CARD PURCHASE")?.direction).toBe("out");
    expect(by_desc("SALARY CREDIT")?.direction).toBe("in");
    expect(by_desc("BILL PAYMENT")?.direction).toBe("out");
    expect(by_desc("TRANSFER RECEIVED")?.direction).toBe("in");
    expect(rows.every((r) => r.status === "new")).toBe(true);
    validate_running_balance(rows, "asset");
    expect(rows.filter((r) => r.status === "needs_review")).toEqual([]);
  });
});