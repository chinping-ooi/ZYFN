import { cash_flow_spending_sen } from "@/lib/dashboard/cash_flow_amounts";
import { is_cash_flow_excluded } from "@/lib/dashboard/cash_flow_exclusion";
import { is_spending_breakdown_go_plus_row } from "@/lib/dashboard/spending_go_plus_exclusion";
import {
  is_fd_category_text,
  is_fixed_deposit_daily_chart_row,
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

/**
 * Dashboard spending donut categories (txn_type / detail labels).
 * Rows skipped when excluded:
 * - FD: is_fixed_deposit_daily_chart_row
 * - Own-account transfers: is_cash_flow_excluded → pair_ref (matched leg) or
 *   card/cc payment on savings and credit-card sides (purchases still count).
 * - TNG GO+: is_spending_breakdown_go_plus_row (GO+ account, GO+ Cash In/Out,
 *   GO+ Daily Earnings, wallet GO+ cash-out markers).
 */
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
      if (is_fixed_deposit_daily_chart_row(row)) continue;
      if (
        is_spending_breakdown_go_plus_row(row, statement.account_kind)
      ) {
        continue;
      }
      if (is_cash_flow_excluded(row, { account_kind: statement.account_kind }))
        continue;
      const spent = cash_flow_spending_sen(row, statement.account_kind, use_micro);
      if (spent <= 0) continue;

      const label = spending_donut_category_label(row);
      if (is_fd_category_text(label)) continue;

      const id = category_bucket_id(label);
      const bucket = buckets.get(id) ?? { label, amount_sen: 0, count: 0 };
      bucket.amount_sen += spent;
      bucket.count += 1;
      buckets.set(id, bucket);
    }
  }

  const rows = [...buckets.entries()]
    .map(([id, bucket]) => ({
      id,
      label: bucket.label,
      account_type: "",
      amount_sen: bucket.amount_sen,
      count: bucket.count,
      pct: 0,
    }))
    .filter((row) => !is_fd_category_text(row.label) && !is_fd_category_text(row.id));

  const filtered_total = rows.reduce((s, r) => s + r.amount_sen, 0);

  return rows
    .map((row) => ({
      ...row,
      pct: filtered_total > 0 ? (row.amount_sen / filtered_total) * 100 : 0,
    }))
    .sort((a, b) => b.amount_sen - a.amount_sen);
}

export function spending_total_sen(rows: Pick<SpendingAccountRow, "amount_sen">[]): number {
  return rows.reduce((sum, row) => sum + row.amount_sen, 0);
}