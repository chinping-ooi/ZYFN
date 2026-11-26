import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { micro_to_sen_display } from "@/lib/tng/money_micro";

const MICRO_PER_SEN = 100;
import type { MinorAmount } from "@/lib/money";

export function wallet_row_to_combined_view(
  row: TransactionDbRow,
): TransactionDbRow {
  return {
    ...row,
    tng_sub_account: "wallet",
    in_micro: row.in_sen * MICRO_PER_SEN,
    out_micro: row.out_sen * MICRO_PER_SEN,
    balance_micro: row.balance_sen * MICRO_PER_SEN,
  };
}

export function merge_tng_statement_rows(
  wallet_rows: TransactionDbRow[],
  go_plus_rows: TransactionDbRow[],
): TransactionDbRow[] {
  const merged = [
    ...wallet_rows.map(wallet_row_to_combined_view),
    ...go_plus_rows.map((row) => ({
      ...row,
      tng_sub_account: "go_plus" as const,
    })),
  ];
  return merged.sort((a, b) => {
    const by_date = b.date.localeCompare(a.date);
    if (by_date !== 0) return by_date;
    return b.sort_id - a.sort_id;
  });
}

function is_wallet_go_plus_cash_out(row: TransactionDbRow): boolean {
  return (
    row.tng_sub_account === "wallet" &&
    (row.txn_type === "GO+ Cash Out" ||
      row.description.includes("GO+ Cash Out"))
  );
}

export function filter_tng_rows_for_go_plus_visibility(
  rows: TransactionDbRow[],
  show_go_plus: boolean,
): TransactionDbRow[] {
  if (show_go_plus) return rows;
  return rows.filter(
    (row) =>
      row.tng_sub_account !== "go_plus" && !is_wallet_go_plus_cash_out(row),
  );
}

export function combined_tng_closing_sen(
  wallet_rows: TransactionDbRow[],
  go_plus_rows: TransactionDbRow[],
): MinorAmount {
  const wallet_closing = wallet_rows[0]?.balance_sen ?? 0;
  const go_closing = go_plus_rows[0]?.balance_micro ?? 0;
  return wallet_closing + micro_to_sen_display(go_closing);
}