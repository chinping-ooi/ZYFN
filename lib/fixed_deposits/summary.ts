import type {
  FixedDepositRecord,
  FixedDepositSummary,
} from "@/lib/fixed_deposits/types";

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

  return {
    active_principal_major,
    active_count,
    matured_count,
    next_maturity_date: next?.maturity_date ?? null,
    next_maturity_receipt: next?.receipt_no ?? null,
    total_interest_earned_major,
  };
}