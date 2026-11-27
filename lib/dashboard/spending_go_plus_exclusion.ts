import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import type { TransactionAccountKind } from "@/lib/transactions/account_config";

/**
 * TNG GO+ movements (eWallet ↔ GO+), using import-normalised txn_type labels
 * and wallet GO+ cash-out markers from {@link ../tng/combined_statement.ts}.
 */
export function is_spending_breakdown_go_plus_row(
  row: Pick<
    TransactionDbRow,
    "txn_type" | "description" | "detail" | "tng_sub_account"
  >,
  account_kind: TransactionAccountKind,
): boolean {
  if (account_kind === "tng_go_plus") return true;
  if (row.tng_sub_account === "go_plus") return true;

  const txn = row.txn_type.trim();
  const lower = txn.toLowerCase();

  if (
    txn === "GO+ Daily Earnings" ||
    txn === "GO+ Cash In" ||
    txn === "GO+ Cash Out"
  ) {
    return true;
  }

  if (
    lower.includes("go+ daily") ||
    lower.includes("go+ cash in") ||
    lower.includes("go+ cash out") ||
    lower.includes("ewallet cash out")
  ) {
    return true;
  }

  const blob = `${row.description} ${row.detail}`.toLowerCase();
  return blob.includes("go+ cash in") || blob.includes("go+ cash out");
}