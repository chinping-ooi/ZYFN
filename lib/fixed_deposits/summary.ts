import type {
  FixedDepositRecord,
  FixedDepositSummary,
} from "@/lib/fixed_deposits/types";

function days_until_maturity(maturity_date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mat = new Date(`${maturity_date}T00:00:00`);
  return Math.ceil((mat.getTime() - today.getTime()) / 86_400_000);
}

function format_days_left(days: number): number | string {
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  return days;
}

export function summarize_fixed_deposits(
  rows: FixedDepositRecord[],
): FixedDepositSummary {
  let active_principal_major = 0;
  let active_count = 0;
  let matured_count = 0;
  let total_interest_earned_major = 0;

  const active_rows: FixedDepositRecord[] = [];

  for (const row of rows) {
    if (row.status === 1) {
      active_count += 1;
      active_principal_major += row.principal_major;
      active_rows.push(row);
    } else {
      matured_count += 1;
      total_interest_earned_major += row.interest_earned_major ?? 0;
    }
  }

  active_rows.sort((a, b) => a.maturity_date.localeCompare(b.maturity_date));
  const next = active_rows[0];
  const next_days =
    next?.maturity_date != null
      ? format_days_left(days_until_maturity(next.maturity_date))
      : null;

  return {
    active_principal_major,
    active_count,
    matured_count,
    next_maturity_date: next?.maturity_date ?? null,
    next_maturity_receipt: next?.receipt_no ?? null,
    next_maturity_principal_major: next?.principal_major ?? null,
    next_maturity_days_left: next_days,
    total_interest_earned_major,
  };
}