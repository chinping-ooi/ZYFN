import {
  cash_flow_income_sen,
  cash_flow_spending_sen,
} from "@/lib/dashboard/cash_flow_amounts";
import { is_cash_flow_excluded } from "@/lib/dashboard/cash_flow_exclusion";
import type { TransactionAccountKind } from "@/lib/transactions/account_config";
import { kl_month_key } from "@/lib/datetime/kl_month_key";
import { resolve_default_month_key } from "@/lib/datetime/default_statement_month";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import type { MinorAmount } from "@/lib/money";
import { micro_to_sen_display } from "@/lib/tng/money_micro";

export type MonthKey = string;

export type MonthlyAggregate = {
  month: MonthKey;
  label: string;
  income_sen: MinorAmount;
  spending_sen: MinorAmount;
};

export type DashboardMetrics = {
  months: { value: MonthKey; label: string }[];
  default_month: MonthKey;
  accounts: {
    id: string;
    name: string;
    balance_sen: MinorAmount;
    kind: TransactionAccountKind;
  }[];
  monthly: MonthlyAggregate[];
};

export type DashboardLoadResult =
  | { kind: "data"; metrics: DashboardMetrics; statements: AccountStatementFromDb[] }
  | { kind: "missing"; message: string }
  | { kind: "error"; message: string; details?: string };

function month_label(key: MonthKey): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(`${key}-01T12:00:00+08:00`));
}

function accumulate_row(
  buckets: Map<MonthKey, { income_sen: number; spending_sen: number }>,
  row: TransactionDbRow,
  account_kind: TransactionAccountKind,
  use_micro: boolean,
) {
  if (is_cash_flow_excluded(row, { account_kind })) return;
  const key = kl_month_key(row.date);
  const bucket = buckets.get(key) ?? { income_sen: 0, spending_sen: 0 };
  bucket.income_sen += cash_flow_income_sen(row, account_kind, use_micro);
  bucket.spending_sen += cash_flow_spending_sen(row, account_kind, use_micro);
  buckets.set(key, bucket);
}

export function build_dashboard_metrics(
  statements: AccountStatementFromDb[],
): DashboardMetrics {
  const buckets = new Map<
    MonthKey,
    { income_sen: number; spending_sen: number }
  >();

  for (const statement of statements) {
    const use_micro = statement.amount_scale === "micro";
    for (const row of statement.rows) {
      accumulate_row(buckets, row, statement.account_kind, use_micro);
    }
  }

  const monthly: MonthlyAggregate[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      month,
      label: month_label(month),
      income_sen: values.income_sen,
      spending_sen: values.spending_sen,
    }));

  const months = monthly
    .map((m) => ({ value: m.month, label: m.label }))
    .sort((a, b) => b.value.localeCompare(a.value));
  const default_month = resolve_default_month_key(
    months.map((m) => m.value),
  );

  const accounts: DashboardMetrics["accounts"] = statements.map((s) => {
    const use_micro = s.amount_scale === "micro";
    const balance_sen = use_micro
      ? micro_to_sen_display(s.closing_micro)
      : s.closing_sen;
    const id =
      s.account_ref.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "account";
    return {
      id,
      name: s.account_label,
      balance_sen,
      kind: s.account_kind,
    };
  });

  return {
    months,
    default_month,
    accounts,
    monthly,
  };
}

export function snapshot_for_month(
  metrics: DashboardMetrics,
  month: MonthKey,
): MonthlyAggregate | undefined {
  return metrics.monthly.find((m) => m.month === month);
}

export function chart_window(
  metrics: DashboardMetrics,
  month: MonthKey,
  window = 6,
): MonthlyAggregate[] {
  const index = metrics.monthly.findIndex((m) => m.month === month);
  if (index < 0) return metrics.monthly.slice(-window);
  const start = Math.max(0, index - window + 1);
  return metrics.monthly.slice(start, index + 1);
}