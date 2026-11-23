import type { FixedDepositRow, FixedDepositRecord, MonthKey } from "@/data/types";
import { resolve_fd_status, status_label } from "@/lib/fd_status";

export function to_fd_table_rows(
  records: FixedDepositRecord[],
  month: MonthKey,
): FixedDepositRow[] {
  const as_of =
    month === "2026-11" ? "2026-11-20" : "2026-10-31";
  return records.map((deposit) => ({
    ...deposit,
    status: resolve_fd_status(
      deposit.maturity_iso,
      as_of,
      deposit.matured,
    ),
  }));
}

export { status_label };