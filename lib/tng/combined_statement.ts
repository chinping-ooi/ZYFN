import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import {
  pocket_closing_as_of_month,
  pocket_closing_latest,
} from "@/lib/supabase/transaction_statement";
import type { MinorAmount } from "@/lib/money";
import { micro_to_sen_display, type MicroAmount } from "@/lib/tng/money_micro";
import { tng_balance_pocket } from "@/lib/tng/pocket";

const MICRO_PER_SEN = 100;

function row_micro_from_parts(
  row: TransactionDbRow,
  field: "in" | "out" | "balance",
): MicroAmount {
  if (field === "in") {
    return row.in_micro !== 0 ? row.in_micro : row.in_sen * MICRO_PER_SEN;
  }
  if (field === "out") {
    return row.out_micro !== 0 ? row.out_micro : row.out_sen * MICRO_PER_SEN;
  }
  return row.balance_micro !== 0
    ? row.balance_micro
    : row.balance_sen * MICRO_PER_SEN;
}

export function wallet_row_to_combined_view(
  row: TransactionDbRow,
): TransactionDbRow {
  return {
    ...row,
    tng_sub_account: "wallet",
    in_micro: row_micro_from_parts(row, "in"),
    out_micro: row_micro_from_parts(row, "out"),
    balance_micro: row_micro_from_parts(row, "balance"),
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
  const wallet = pocket_closing_latest(wallet_rows);
  const go = pocket_closing_latest(go_plus_rows);
  return wallet.closing_sen + micro_to_sen_display(go.closing_micro);
}

function split_tng_combined_rows(merged_rows: TransactionDbRow[]): {
  wallet_rows: TransactionDbRow[];
  go_plus_rows: TransactionDbRow[];
} {
  return {
    wallet_rows: merged_rows.filter(
      (r) => tng_balance_pocket(r) === "wallet",
    ),
    go_plus_rows: merged_rows.filter(
      (r) => tng_balance_pocket(r) === "go_plus",
    ),
  };
}

/** eWallet + GO+ closing for a statement month (full ledger uses loader totals). */
export function combined_tng_closing_for_statement(
  merged_rows: TransactionDbRow[],
  month: string | "all",
  closing_sen_full: MinorAmount,
  closing_micro_full: MicroAmount,
): { closing_sen: MinorAmount; closing_micro: MicroAmount } {
  const { wallet_rows, go_plus_rows } = split_tng_combined_rows(merged_rows);

  if (month === "all") {
    return {
      closing_sen: closing_sen_full,
      closing_micro: closing_micro_full,
    };
  }

  const wallet = pocket_closing_as_of_month(wallet_rows, month);
  const go = pocket_closing_as_of_month(go_plus_rows, month);

  return {
    closing_sen: wallet.closing_sen + micro_to_sen_display(go.closing_micro),
    closing_micro: wallet.closing_micro + go.closing_micro,
  };
}