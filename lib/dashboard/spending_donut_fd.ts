import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";

/** Donut slice label: txn_type, else detail, else fallback. */
export function spending_donut_category_label(row: TransactionDbRow): string {
  const type = row.txn_type.trim();
  if (type) return type;
  const detail = row.detail.trim();
  if (detail) return detail;
  return "Uncategorised";
}

function normalise_fd_token(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

/** FD-related txn_type / category text (underscore or spaced). */
export function is_fd_category_text(value: string): boolean {
  const key = normalise_fd_token(value);
  if (!key) return false;
  if (key.startsWith("fd_")) return true;
  return key === "fd_placement" || key === "fd_withdrawal";
}

/**
 * Fixed-deposit ledger rows (daily chart, dashboard donuts, breakdown).
 * Matches fd_* txn types (underscore or spaced), fixed_deposit_id, and FD category text in detail.
 */
export function is_fixed_deposit_daily_chart_row(
  row: Pick<
    TransactionDbRow,
    "txn_type" | "detail" | "description" | "fixed_deposit_id"
  >,
): boolean {
  if (is_fd_category_text(row.txn_type)) return true;
  if (is_fd_category_text(row.detail)) return true;
  if (is_fd_category_text(row.description)) return true;
  const fd_id = row.fixed_deposit_id;
  if (fd_id != null && fd_id !== 0) return true;
  return is_fd_category_text(spending_donut_category_label(row as TransactionDbRow));
}

/** @deprecated Use is_fixed_deposit_daily_chart_row — same rules, including donut category labels. */
export function is_spending_donut_fd_row(
  row: Pick<
    TransactionDbRow,
    "txn_type" | "detail" | "description" | "fixed_deposit_id"
  >,
): boolean {
  return is_fixed_deposit_daily_chart_row(row);
}