import type { ParsedSheet } from "@/lib/workbook/types";
import { tng_reconcile_enabled } from "@/lib/tng/config";
import type { ParsedTngDump } from "@/lib/tng/types";
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
  accounts: { id: string; name: string; balance_sen: MinorAmount }[];
  monthly: MonthlyAggregate[];
  data_notes: {
    skipped_total: number;
    reconcile_warnings_total: number;
  };
};

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

function build_monthly_from_sheets(sheets: ParsedSheet[]): MonthlyAggregate[] {
  const totals = new Map<MonthKey, { income_sen: number; spending_sen: number }>();

  for (const sheet of sheets) {
    for (const tx of sheet.transactions) {
      const key = month_key(tx.date);
      const bucket = totals.get(key) ?? { income_sen: 0, spending_sen: 0 };
      bucket.spending_sen += tx.debit_sen;
      bucket.income_sen += tx.credit_sen;
      totals.set(key, bucket);
    }
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      month,
      label: month_label(month),
      income_sen: values.income_sen,
      spending_sen: values.spending_sen,
    }));
}

function merge_tng_monthly(
  bank_monthly: MonthlyAggregate[],
  tng: ParsedTngDump,
): MonthlyAggregate[] {
  const totals = new Map<
    MonthKey,
    { income_micro: number; spending_micro: number; label: string }
  >();

  for (const row of bank_monthly) {
    totals.set(row.month, {
      income_micro: row.income_sen * 100,
      spending_micro: row.spending_sen * 100,
      label: row.label,
    });
  }

  for (const row of tng.rows) {
    if (!row.affects_totals || row.direction === "transfer") continue;
    const key = month_key(row.date);
    const bucket = totals.get(key) ?? {
      income_micro: 0,
      spending_micro: 0,
      label: month_label(key),
    };
    if (row.direction === "in") {
      bucket.income_micro += row.credit_micro;
    } else if (row.direction === "out") {
      bucket.spending_micro += row.debit_micro;
    }
    totals.set(key, bucket);
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      month,
      label: values.label,
      income_sen: micro_to_sen_display(values.income_micro),
      spending_sen: micro_to_sen_display(values.spending_micro),
    }));
}

export function build_dashboard_metrics(
  hlb: ParsedSheet,
  pbe: ParsedSheet,
  tng: ParsedTngDump | null = null,
): DashboardMetrics {
  const bank_monthly = build_monthly_from_sheets([hlb, pbe]);
  const monthly = tng ? merge_tng_monthly(bank_monthly, tng) : bank_monthly;
  const months = monthly.map((m) => ({ value: m.month, label: m.label }));
  const default_month = months.at(-1)?.value ?? new Date().toISOString().slice(0, 7);

  const accounts: DashboardMetrics["accounts"] = [
    {
      id: "hong_leong",
      name: hlb.account_label,
      balance_sen: hlb.closing_balance_sen,
    },
    {
      id: "public_bank",
      name: pbe.account_label,
      balance_sen: pbe.closing_balance_sen,
    },
  ];

  if (tng) {
    accounts.push(
      {
        id: "tng",
        name: "TNG eWallet",
        balance_sen: micro_to_sen_display(tng.wallet_closing_micro),
      },
      {
        id: "go_plus",
        name: "GO+",
        balance_sen: micro_to_sen_display(tng.go_plus_closing_micro),
      },
    );
  }

  return {
    months,
    default_month,
    accounts,
    monthly,
    data_notes: {
      skipped_total:
        hlb.skipped_rows.length +
        pbe.skipped_rows.length +
        (tng?.skipped_records.length ?? 0),
      reconcile_warnings_total:
        hlb.reconcile_warning_count +
        pbe.reconcile_warning_count +
        (tng && tng_reconcile_enabled() ? tng.reconcile_warning_count : 0),
    },
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