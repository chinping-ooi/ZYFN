import { cash_flow_spending_sen } from "@/lib/dashboard/cash_flow_amounts";
import { is_cash_flow_excluded } from "@/lib/dashboard/cash_flow_exclusion";
import {
  is_fd_category_text,
  is_fixed_deposit_daily_chart_row,
} from "@/lib/dashboard/spending_donut_fd";
import type { MonthKey } from "@/lib/dashboard/metrics";
import { kl_month_key } from "@/lib/datetime/kl_month_key";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { MinorAmount } from "@/lib/money";
import {
  spending_breakdown_account_bucket,
  type TransactionAccountKind,
} from "@/lib/transactions/account_config";

export type SpendingAccountRow = {
  id: string;
  label: string;
  account_type: string;
  amount_sen: MinorAmount;
  count: number;
  pct: number;
};

function account_type_label(kind: TransactionAccountKind, bucket_id: string): string {
  if (bucket_id === "tng") return "Wallet";
  if (kind === "credit_card") return "Credit card";
  if (kind === "tng_wallet" || kind === "tng_go_plus") return "Wallet";
  return "Savings";
}

function is_fd_account_bucket(id: string, label: string): boolean {
  if (is_fd_category_text(id) || is_fd_category_text(label)) return true;
  const normalised = `${id} ${label}`.toLowerCase();
  return normalised.includes("fixed") && normalised.includes("deposit");
}

export function spending_breakdown_for_month(
  statements: AccountStatementFromDb[],
  month: MonthKey,
): SpendingAccountRow[] {
  const buckets = new Map<
    string,
    { label: string; account_type: string; amount_sen: number; count: number }
  >();

  for (const statement of statements) {
    const { id, label } = spending_breakdown_account_bucket(statement);
    if (is_fd_account_bucket(id, label)) continue;

    const use_micro = statement.amount_scale === "micro";
    const account_type = account_type_label(statement.account_kind, id);

    for (const row of statement.rows) {
      if (kl_month_key(row.date) !== month) continue;
      if (is_fixed_deposit_daily_chart_row(row)) continue;
      if (is_cash_flow_excluded(row, { account_kind: statement.account_kind }))
        continue;
      const spent = cash_flow_spending_sen(row, statement.account_kind, use_micro);
      if (spent <= 0) continue;

      const bucket = buckets.get(id) ?? {
        label,
        account_type,
        amount_sen: 0,
        count: 0,
      };
      bucket.amount_sen += spent;
      bucket.count += 1;
      buckets.set(id, bucket);
    }
  }

  const rows = [...buckets.entries()]
    .map(([id, bucket]) => ({
      id,
      label: bucket.label,
      account_type: bucket.account_type,
      amount_sen: bucket.amount_sen,
      count: bucket.count,
      pct: 0,
    }))
    .filter(
      (row) =>
        row.amount_sen > 0 &&
        !is_fd_account_bucket(row.id, row.label) &&
        !is_fd_category_text(row.label) &&
        !is_fd_category_text(row.id),
    );

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