import { kl_month_key } from "@/lib/datetime/kl_month_key";
import { statement_month_key_label } from "@/lib/datetime/default_statement_month";
import type { FixedDepositRecord } from "@/lib/fixed_deposits/types";

function month_end_iso(month_key: string): string {
  const [year, month] = month_key.split("-").map(Number);
  const last_day = new Date(year, month, 0).getDate();
  return `${month_key}-${String(last_day).padStart(2, "0")}`;
}

/** Calendar month bounds for overlap checks (inclusive, YYYY-MM-DD). */
function month_span(month_key: string): { start: string; end: string } {
  return {
    start: `${month_key}-01`,
    end: month_end_iso(month_key),
  };
}

/**
 * A placement is in view when it was opened, matured, or its term overlapped the month.
 */
export function fixed_deposit_relevant_to_month(
  row: FixedDepositRecord,
  month: string | "all",
): boolean {
  if (month === "all") return true;

  if (kl_month_key(row.start_date) === month) return true;
  if (kl_month_key(row.maturity_date) === month) return true;

  const { start, end } = month_span(month);
  return row.start_date <= end && row.maturity_date >= start;
}

export function filter_fixed_deposits_by_month(
  rows: FixedDepositRecord[],
  month: string | "all",
): FixedDepositRecord[] {
  return rows.filter((row) => fixed_deposit_relevant_to_month(row, month));
}

export function fixed_deposit_month_options(rows: FixedDepositRecord[]) {
  const keys = new Set<string>();
  for (const row of rows) {
    keys.add(kl_month_key(row.start_date));
    keys.add(kl_month_key(row.maturity_date));
  }
  const sorted = [...keys].sort().reverse();
  return [
    { value: "all", label: "All months" },
    ...sorted.map((key) => ({
      value: key,
      label: statement_month_key_label(key),
    })),
  ];
}