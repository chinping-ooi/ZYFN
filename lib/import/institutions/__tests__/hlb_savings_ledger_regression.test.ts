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

const SAME_DAY_NEWEST_FIRST = `
Hong Leong Bank Berhad
BASIC SAVINGS ACCOUNT STATEMENT
Date / Tarikh : 31-10-2026
${column_header_line()}
Balance from previous statement   100.32
${txn_line("29-10-2026", "Large receipt", "3631.75", undefined, "3732.07")}
${txn_line("29-10-2026", "Fee payment", undefined, "4.00", "3728.07")}
${txn_line("29-10-2026", "Fee payment two", undefined, "4.00", "3724.07")}
Closing Balance / Baki Akhir : 3724.07
`;

describe("hlb_savings ledger order regression", () => {
  it("validates end-of-day when PDF same-day rows are newest-first", () => {
    const { rows, meta } = parse_hlb_savings_statement(SAME_DAY_NEWEST_FIRST);
    expect(meta.opening_balance_major).toBe("100.32");
    expect(rows.every((r) => r.status === "new")).toBe(true);
    expect(
      rows.every((r) => !r.review_reasons.includes("End-of-day balance mismatch")),
    ).toBe(true);

    const ledger_chrono = [...rows].sort((a, b) =>
      a.txn_at.localeCompare(b.txn_at),
    );
    expect(ledger_chrono.map((r) => r.amount_major)).toEqual([
      "3631.75",
      "4.00",
      "4.00",
    ]);

    validate_running_balance(ledger_chrono);
    for (const row of ledger_chrono) {
      expect(row.review_reasons).not.toContain("Balance mismatch");
    }
  });

  it("still lists rows newest-first for preview", () => {
    const { rows } = parse_hlb_savings_statement(SAME_DAY_NEWEST_FIRST);
    expect(rows[0]?.description).toBe("Fee payment two");
    expect(rows.at(-1)?.description).toBe("Large receipt");
  });
});