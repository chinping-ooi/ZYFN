import { kl_month_key } from "@/lib/datetime/kl_month_key";
import { micro_to_sen_display } from "@/lib/tng/money_micro";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import type { MonthKey } from "@/lib/dashboard/metrics";
import type { MinorAmount } from "@/lib/money";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { TransactionAccountKind } from "@/lib/transactions/account_config";

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

/** Ledger out column for bank/wallet rows. */
export function ledger_money_out_sen(
  row: TransactionDbRow,
  use_micro: boolean,
): number {
  if (use_micro) {
    return row.out_micro > 0 ? micro_to_sen_display(row.out_micro) : 0;
  }
  return row.out_sen > 0 ? row.out_sen : 0;
}

/**
 * Credit card bill payments (savings/wallet out plus matching card-side credits).
 * — Any account: `txn_type` is `card_payment`, `cc_payment`, or `credit_card_payment`.
 * — Credit card ledger: `txn_type` contains `payment` or `refund` (bill pay / credits).
 */
export function is_credit_card_payment_daily_chart_row(
  row: Pick<TransactionDbRow, "txn_type">,
  account_kind: TransactionAccountKind,
): boolean {
  const type = row.txn_type.trim().toLowerCase();
  if (
    type === "card_payment" ||
    type === "cc_payment" ||
    type === "credit_card_payment"
  ) {
    return true;
  }
  if (account_kind === "credit_card") {
    return type.includes("payment") || type.includes("refund");
  }
  return false;
}

/** Money counted toward the daily chart (purchases on card `in_sen` still included). */
export function daily_chart_money_out_sen(
  row: TransactionDbRow,
  account_kind: TransactionAccountKind,
  use_micro: boolean,
): number {
  if (use_micro) {
    return row.out_micro > 0 ? micro_to_sen_display(row.out_micro) : 0;
  }
  if (account_kind === "credit_card") {
    if (row.out_sen > 0) return row.out_sen;
    if (row.in_sen > 0) return row.in_sen;
    return 0;
  }
  return row.out_sen > 0 ? row.out_sen : 0;
}

/**
 * Fixed-deposit ledger rows (aligned with dashboard cash-flow FD rules).
 * Matches when `txn_type` is `fd_placement`, `fd_withdrawal`, starts with `fd_`,
 * or `fixed_deposit_id` is set.
 */
export function is_fixed_deposit_daily_chart_row(
  row: Pick<TransactionDbRow, "txn_type" | "fixed_deposit_id">,
): boolean {
  const type = row.txn_type.trim().toLowerCase();
  if (type.startsWith("fd_")) return true;
  if (type === "fd_placement" || type === "fd_withdrawal") return true;
  const fd_id = row.fixed_deposit_id;
  return fd_id != null && fd_id !== 0;
}

/**
 * Daily totals for one dashboard month (excludes FD and card bill payments).
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
      if (is_fixed_deposit_daily_chart_row(row)) continue;
      if (
        is_credit_card_payment_daily_chart_row(row, statement.account_kind)
      ) {
        continue;
      }
      const spent = daily_chart_money_out_sen(
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