import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";

/** Which balance column on a merged TNG row (wallet vs GO+). */
export function tng_balance_pocket(
  row: Pick<TransactionDbRow, "txn_type" | "description" | "tng_sub_account">,
): "wallet" | "go_plus" {
  const txn = row.txn_type.trim();
  const lower = txn.toLowerCase();

  if (
    txn === "GO+ Daily Earnings" ||
    lower.includes("go+ daily") ||
    txn === "GO+ Cash In" ||
    lower.includes("go+ cash in")
  ) {
    return "go_plus";
  }

  if (row.tng_sub_account === "go_plus") return "go_plus";
  return "wallet";
}

/** Split one physical TNG ledger into eWallet vs GO+ pockets (newest-first order kept). */
export function partition_tng_source_rows(rows: TransactionDbRow[]): {
  wallet_rows: TransactionDbRow[];
  go_plus_rows: TransactionDbRow[];
} {
  const wallet_rows: TransactionDbRow[] = [];
  const go_plus_rows: TransactionDbRow[] = [];

  for (const row of rows) {
    const pocket = tng_balance_pocket(row);
    if (pocket === "go_plus") {
      go_plus_rows.push({ ...row, tng_sub_account: "go_plus" });
    } else {
      wallet_rows.push({ ...row, tng_sub_account: "wallet" });
    }
  }

  return { wallet_rows, go_plus_rows };
}