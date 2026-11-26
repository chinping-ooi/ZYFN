import { cash_flow_spending_sen } from "@/lib/dashboard/cash_flow_amounts";
import { is_cash_flow_excluded } from "@/lib/dashboard/cash_flow_exclusion";
import {
  is_spending_donut_fd_row,
  spending_donut_category_label,
} from "@/lib/dashboard/spending_donut_fd";
import type { MonthKey } from "@/lib/dashboard/metrics";
import { kl_month_key } from "@/lib/datetime/kl_month_key";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { MinorAmount } from "@/lib/money";

export type SpendingAccountRow = {
  id: string;
  label: string;
  account_type: string;
  amount_sen: MinorAmount;
  count: number;
  pct: number;
};

function category_bucket_id(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "other";
}

export function spending_breakdown_for_month(
  statements: AccountStatementFromDb[],
  month: MonthKey,
): SpendingAccountRow[] {
  const buckets = new Map<
    string,
    { label: string; amount_sen: number; count: number }
  >();

  for (const statement of statements) {
    const use_micro = statement.amount_scale === "micro";

    for (const row of statement.rows) {
      if (kl_month_key(row.date) !== month) continue;
      if (is_spending_donut_fd_row(row)) continue;
      if (is_cash_flow_excluded(row, { account_kind: statement.account_kind }))
        continue;
      const spent = cash_flow_spending_sen(row, statement.account_kind, use_micro);
      if (spent <= 0) continue;

      const label = spending_donut_category_label(row);
      const id = category_bucket_id(label);
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
      account_type: "",
      amount_sen: bucket.amount_sen,
      count: bucket.count,
      pct: total > 0 ? (bucket.amount_sen / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount_sen - a.amount_sen);
}

export function spending_total_sen(rows: Pick<SpendingAccountRow, "amount_sen">[]): number {
  return rows.reduce((sum, row) => sum + row.amount_sen, 0);
}