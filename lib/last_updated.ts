import { format_last_updated_footer } from "@/lib/format/date";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { FixedDepositRecord } from "@/lib/fixed_deposits/types";

function max_iso_date(dates: string[]): string | null {
  const normalized = dates
    .map((d) => d?.slice(0, 10))
    .filter((d): d is string => Boolean(d));
  if (normalized.length === 0) return null;
  return normalized.reduce((a, b) => (a > b ? a : b));
}

export function latest_transaction_date(
  rows: { date: string }[],
): string | null {
  return max_iso_date(rows.map((row) => row.date));
}

export function latest_transaction_date_across(
  statements: AccountStatementFromDb[],
): string | null {
  const dates = statements.flatMap((s) => s.rows.map((r) => r.date));
  return max_iso_date(dates);
}

export function latest_fixed_deposit_date(
  rows: FixedDepositRecord[],
): string | null {
  if (rows.length === 0) return null;
  const dates: string[] = [];
  for (const row of rows) {
    dates.push(row.start_date, row.maturity_date);
  }
  return max_iso_date(dates);
}

export { format_last_updated_footer };