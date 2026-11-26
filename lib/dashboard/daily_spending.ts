import {
  cash_flow_spending_sen,
} from "@/lib/dashboard/cash_flow_amounts";
import { is_cash_flow_excluded } from "@/lib/dashboard/cash_flow_exclusion";
import { kl_month_key } from "@/lib/datetime/kl_month_key";
import type { MonthKey } from "@/lib/dashboard/metrics";
import type { MinorAmount } from "@/lib/money";
import type { AccountStatementFromDb } from "@/lib/supabase/types";

const KL = "Asia/Kuala_Lumpur";

export type DailySpendingSeries = {
  /** Category labels "1" … last day of month. */
  day_labels: string[];
  /** Spending per calendar day in KL, index 0 = day 1. */
  spending_sen: MinorAmount[];
  days_in_month: number;
  month_total_sen: MinorAmount;
};

function days_in_month_key(month: MonthKey): number {
  const [year, month_num] = month.split("-").map(Number);
  return new Date(year, month_num, 0).getDate();
}

function kl_day_of_month(iso: string): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KL,
    day: "numeric",
  }).formatToParts(new Date(iso));
  return Number(parts.find((p) => p.type === "day")?.value ?? "1");
}

/**
 * Daily cash-out totals for one dashboard month (same rules as monthly spending KPI).
 */
export function daily_spending_for_month(
  statements: AccountStatementFromDb[],
  month: MonthKey,
): DailySpendingSeries {
  const days_in_month = days_in_month_key(month);
  const buckets = new Array<MinorAmount>(days_in_month).fill(0);

  for (const statement of statements) {
    const use_micro = statement.amount_scale === "micro";
    for (const row of statement.rows) {
      if (kl_month_key(row.date) !== month) continue;
      if (is_cash_flow_excluded(row, { account_kind: statement.account_kind })) {
        continue;
      }
      const spent = cash_flow_spending_sen(
        row,
        statement.account_kind,
        use_micro,
      );
      if (spent <= 0) continue;
      const day_index = kl_day_of_month(row.date) - 1;
      if (day_index < 0 || day_index >= days_in_month) continue;
      buckets[day_index] += spent;
    }
  }

  const day_labels = Array.from({ length: days_in_month }, (_, i) =>
    String(i + 1),
  );
  const month_total_sen = buckets.reduce((sum, v) => sum + v, 0);

  return {
    day_labels,
    spending_sen: buckets,
    days_in_month,
    month_total_sen,
  };
}

/** Long date for chart tooltips (KL calendar day). */
export function daily_spending_tooltip_date(
  month: MonthKey,
  day: number,
): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: KL,
  }).format(new Date(`${month}-${String(day).padStart(2, "0")}T12:00:00+08:00`));
}