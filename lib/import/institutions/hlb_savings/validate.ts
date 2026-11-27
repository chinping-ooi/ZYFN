import { parse_index_from_temp_id } from "@/lib/import/institutions/hlb_savings/ledger_order";
import { decimal_myr_to_sen } from "@/lib/supabase/decimal_to_sen";
import type { NormalizedImportRow } from "@/lib/import/types";

function major_number(major: string): number {
  return decimal_myr_to_sen(major) / 100;
}

export function validate_running_balance(
  rows: NormalizedImportRow[],
  mode: "asset" | "liability" = "asset",
): void {
  const chronological = [...rows].sort(
    (a, b) =>
      a.txn_at.localeCompare(b.txn_at) ||
      parse_index_from_temp_id(a.temp_id) - parse_index_from_temp_id(b.temp_id),
  );
  let prev_balance: number | null = null;
  for (const row of chronological) {
    const amount = major_number(row.amount_major);
    const signed =
      mode === "liability"
        ? row.direction === "out"
          ? amount
          : -amount
        : row.direction === "in"
          ? amount
          : -amount;
    const balance = major_number(row.balance_after_major);
    if (prev_balance !== null) {
      const expected = Math.round((prev_balance + signed) * 100) / 100;
      const delta = Math.abs(expected - balance);
      if (delta > 0.02) {
        if (!row.review_reasons.includes("Balance mismatch")) {
          row.review_reasons.push("Balance mismatch");
        }
        if (row.status === "new") {
          row.status = "needs_review";
        }
      }
    }
    prev_balance = balance;
  }
}

export function validate_statement_total(
  rows: NormalizedImportRow[],
  statement_total_major: number | null,
): void {
  if (statement_total_major === null) return;
  const sum_out = rows
    .filter((r) => r.direction === "out")
    .reduce((s, r) => s + major_number(r.amount_major), 0);
  const sum_in = rows
    .filter((r) => r.direction === "in")
    .reduce((s, r) => s + major_number(r.amount_major), 0);
  const net = Math.round((sum_in - sum_out) * 100) / 100;
  const target = Math.round(statement_total_major * 100) / 100;
  if (Math.abs(net - target) > 0.05) {
    for (const row of rows) {
      if (!row.review_reasons.includes("Statement total mismatch")) {
        row.review_reasons.push("Statement total mismatch");
      }
      if (row.status === "new") row.status = "needs_review";
    }
  }
}