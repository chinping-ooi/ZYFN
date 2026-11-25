import { is_cash_flow_excluded } from "@/lib/dashboard/cash_flow_exclusion";
import type { TransactionAccountKind } from "@/lib/transactions/account_config";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { micro_to_sen_display } from "@/lib/tng/money_micro";
import type { MinorAmount } from "@/lib/money";

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

function month_key(iso_date: string): MonthKey {
  return iso_date.slice(0, 7);
}

function month_label(key: MonthKey): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${key}-01T00:00:00Z`));
}

function accumulate_row(
  buckets: Map<MonthKey, { income_sen: number; spending_sen: number }>,
  row: TransactionDbRow,
  use_micro: boolean,
) {
  if (is_cash_flow_excluded(row)) return;
  const key = month_key(row.date);
  const bucket = buckets.get(key) ?? { income_sen: 0, spending_sen: 0 };
  if (use_micro) {
    if (row.in_micro > 0) {
      bucket.income_sen += micro_to_sen_display(row.in_micro);
    }
    if (row.out_micro > 0) {
      bucket.spending_sen += micro_to_sen_display(row.out_micro);
    }
  } else {
    bucket.income_sen += row.in_sen;
    bucket.spending_sen += row.out_sen;
  }
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
      accumulate_row(buckets, row, use_micro);
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

  const months = monthly.map((m) => ({ value: m.month, label: m.label }));
  const default_month =
    months.at(-1)?.value ?? new Date().toISOString().slice(0, 7);

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