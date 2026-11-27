import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";
import type { MinorAmount } from "@/lib/money";
import { micro_to_sen_display, type MicroAmount } from "@/lib/tng/money_micro";

const MICRO_PER_SEN = 100;

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

function split_tng_combined_rows(merged_rows: TransactionDbRow[]): {
  wallet_rows: TransactionDbRow[];
  go_plus_rows: TransactionDbRow[];
} {
  return {
    wallet_rows: merged_rows.filter((r) => r.tng_sub_account === "wallet"),
    go_plus_rows: merged_rows.filter((r) => r.tng_sub_account === "go_plus"),
  };
}

/** eWallet + GO+ closing for a statement month (full ledger uses loader totals). */
export function combined_tng_closing_for_statement(
  merged_rows: TransactionDbRow[],
  month: string | "all",
  closing_sen_full: MinorAmount,
  closing_micro_full: MicroAmount,
): { closing_sen: MinorAmount; closing_micro: MicroAmount } {
  if (month === "all") {
    return {
      closing_sen: closing_sen_full,
      closing_micro: closing_micro_full,
    };
  }

  const { wallet_rows, go_plus_rows } = split_tng_combined_rows(merged_rows);
  const wallet_full_sen = wallet_rows[0]?.balance_sen ?? 0;
  const wallet_full_micro =
    wallet_rows[0]?.balance_micro ?? wallet_full_sen * MICRO_PER_SEN;
  const go_full_micro = go_plus_rows[0]?.balance_micro ?? 0;

  const wallet_slice = build_transaction_statement(
    wallet_rows,
    month,
    wallet_full_sen,
    wallet_full_micro,
  );
  const go_slice = build_transaction_statement(
    go_plus_rows,
    month,
    0,
    go_full_micro,
  );

  return {
    closing_sen:
      wallet_slice.closing_sen + micro_to_sen_display(go_slice.closing_micro),
    closing_micro: wallet_slice.closing_micro + go_slice.closing_micro,
  };
}