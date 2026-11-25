import { major_to_minor } from "@/lib/money";
import type {
  FixedDepositRecord,
  FixedDepositTableRow,
} from "@/lib/fixed_deposits/types";

function format_days_left(days: number): number | string {
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  return days;
}

function days_until_maturity(maturity_date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mat = new Date(`${maturity_date}T00:00:00`);
  return Math.ceil((mat.getTime() - today.getTime()) / 86_400_000);
}

function to_table_row(row: FixedDepositRecord): FixedDepositTableRow {
  const active = row.status === 1;
  return {
    ...row,
    principal_sen: major_to_minor(row.principal_major),
    interest_earned_sen:
      row.interest_earned_major === null
        ? null
        : major_to_minor(row.interest_earned_major),
    status_label: active ? "Active" : "Matured",
    days_left: active
      ? format_days_left(days_until_maturity(row.maturity_date))
      : "—",
  };
}

function sort_by_maturity(
  rows: FixedDepositRecord[],
): FixedDepositRecord[] {
  return [...rows].sort((a, b) =>
    a.maturity_date.localeCompare(b.maturity_date),
  );
}

export function to_table_rows(rows: FixedDepositRecord[]): FixedDepositTableRow[] {
  return sort_by_maturity(rows).map(to_table_row);
}