import { is_cash_flow_excluded } from "@/lib/dashboard/cash_flow_exclusion";
import type { MonthKey } from "@/lib/dashboard/metrics";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { micro_to_sen_display } from "@/lib/tng/money_micro";
import type { MinorAmount } from "@/lib/money";
import { spending_breakdown_account_bucket } from "@/lib/transactions/account_config";

export type SpendingCategoryRow = {
  id: string;
  label: string;
  amount_sen: MinorAmount;
  count: number;
  pct: number;
};

function month_key(iso_date: string): MonthKey {
  return iso_date.slice(0, 7);
}

function outflow_sen(row: TransactionDbRow, use_micro: boolean): number {
  if (use_micro) {
    return row.out_micro > 0 ? micro_to_sen_display(row.out_micro) : 0;
  }
  return row.out_sen;
}

export function spending_breakdown_for_month(
  statements: AccountStatementFromDb[],
  month: MonthKey,
): SpendingCategoryRow[] {
  const buckets = new Map<
    string,
    { label: string; amount_sen: number; count: number }
  >();

  for (const statement of statements) {
    const { id, label } = spending_breakdown_account_bucket(statement);
    const use_micro = statement.amount_scale === "micro";
    for (const row of statement.rows) {
      if (month_key(row.date) !== month) continue;
      if (is_cash_flow_excluded(row)) continue;
      const spent = outflow_sen(row, use_micro);
      if (spent <= 0) continue;
      const bucket = buckets.get(id) ?? { label, amount_sen: 0, count: 0 };
      bucket.amount_sen += spent;
      bucket.count += 1;
      buckets.set(id, bucket);
    }
  }

  const total = [...buckets.values()].reduce((s, b) => s + b.amount_sen, 0);

  return [...buckets.entries()]
    .map(([id, bucket]) => ({
      id,
      label: bucket.label,
      amount_sen: bucket.amount_sen,
      count: bucket.count,
      pct: total > 0 ? (bucket.amount_sen / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount_sen - a.amount_sen);
}