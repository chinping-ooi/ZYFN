import { cash_flow_exclusion_reason } from "@/lib/dashboard/cash_flow_exclusion_reason";
import type { MonthKey } from "@/lib/dashboard/metrics";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { micro_to_sen_display } from "@/lib/tng/money_micro";

export type MonthIncomeAuditRow = {
  account: string;
  date: string;
  description: string;
  txn_type: string;
  in_sen: number;
  included: boolean;
  exclusion_reason: string | null;
  pair_ref: string | null;
};

function month_key(iso_date: string): MonthKey {
  return iso_date.slice(0, 7);
}

function inflow_sen(row: TransactionDbRow, use_micro: boolean): number {
  if (use_micro) {
    return row.in_micro > 0 ? micro_to_sen_display(row.in_micro) : 0;
  }
  return row.in_sen;
}

export function audit_month_income(
  statements: AccountStatementFromDb[],
  month: MonthKey,
): MonthIncomeAuditRow[] {
  const lines: MonthIncomeAuditRow[] = [];

  for (const statement of statements) {
    const use_micro = statement.amount_scale === "micro";
    for (const row of statement.rows) {
      if (month_key(row.date) !== month) continue;
      const in_sen = inflow_sen(row, use_micro);
      if (in_sen <= 0) continue;
      const exclusion_reason = cash_flow_exclusion_reason(row);
      lines.push({
        account: statement.account_label,
        date: row.date.slice(0, 10),
        description: row.description,
        txn_type: row.txn_type,
        in_sen,
        included: exclusion_reason == null,
        exclusion_reason,
        pair_ref: row.pair_ref ?? null,
      });
    }
  }

  lines.sort((a, b) => a.date.localeCompare(b.date) || a.account.localeCompare(b.account));
  return lines;
}