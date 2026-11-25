import type { FixedDepositRecord } from "@/lib/fixed_deposits/types";

/** Count active FD rows with maturity on or before today + `within_days`. */
export function count_maturing_within_days(
  rows: FixedDepositRecord[],
  within_days: number,
  as_of = new Date(),
): number {
  const end = new Date(as_of);
  end.setUTCDate(end.getUTCDate() + within_days);
  const end_iso = end.toISOString().slice(0, 10);

  return rows.filter(
    (r) => r.status === 1 && r.maturity_date <= end_iso,
  ).length;
}