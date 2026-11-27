import { decimal_myr_to_micro } from "@/lib/supabase/decimal_to_micro";
import { decimal_myr_to_sen } from "@/lib/supabase/decimal_to_sen";
import { micro_to_sen_display } from "@/lib/tng/money_micro";
import type { TransactionAccountKind } from "@/lib/transactions/account_config";
import type { MinorAmount } from "@/lib/money";
import type { MicroAmount } from "@/lib/tng/money_micro";

export type AmountScale = "sen" | "micro";

export type TransactionDbRow = {
  /** UTC / calendar instant from `txn_at` — formatted in Asia/Kuala_Lumpur. */
  date: string;
  description: string;
  detail: string;
  txn_type: string;
  fixed_deposit_id?: number | null;
  pair_ref?: string | null;
  in_sen: MinorAmount;
  out_sen: MinorAmount;
  balance_sen: MinorAmount;
  in_micro: MicroAmount;
  out_micro: MicroAmount;
  balance_micro: MicroAmount;
  /** For money_micro column display (GO+ uses 4 dp). */
  tng_sub_account?: "wallet" | "go_plus";
  sort_id: number;
};

export type ZyfnTransactionRow = {
  id: number;
  txn_at: string;
  txn_type: string | null;
  description: string | null;
  direction: "in" | "out";
  amount: string | number;
  balance_after: string | number;
  detail: string | null;
  fixed_deposit_id?: number | null;
  pair_ref?: string | null;
};

function amount_scale_for_kind(kind: TransactionAccountKind): AmountScale {
  if (
    kind === "tng_wallet" ||
    kind === "tng_go_plus" ||
    kind === "tng_combined"
  ) {
    return "micro";
  }
  return "sen";
}

export function map_transaction_row(
  row: ZyfnTransactionRow,
  kind: TransactionAccountKind,
): TransactionDbRow {
  const scale = amount_scale_for_kind(kind);
  const amount_micro =
    scale === "micro" ? decimal_myr_to_micro(row.amount) : 0;
  const balance_micro =
    scale === "micro" ? decimal_myr_to_micro(row.balance_after) : 0;
  const amount_sen =
    scale === "sen"
      ? decimal_myr_to_sen(row.amount)
      : micro_to_sen_display(amount_micro);
  const balance_sen =
    scale === "sen"
      ? decimal_myr_to_sen(row.balance_after)
      : micro_to_sen_display(balance_micro);

  const in_sen = row.direction === "in" ? amount_sen : 0;
  const out_sen = row.direction === "out" ? amount_sen : 0;
  const in_micro = row.direction === "in" ? amount_micro : 0;
  const out_micro = row.direction === "out" ? amount_micro : 0;

  return {
    date: row.txn_at,
    description: (row.description ?? "").trim(),
    detail: (row.detail ?? "").trim(),
    txn_type: (row.txn_type ?? "").trim(),
    fixed_deposit_id: row.fixed_deposit_id ?? null,
    pair_ref: row.pair_ref ?? null,
    in_sen,
    out_sen,
    balance_sen,
    in_micro,
    out_micro,
    balance_micro,
    tng_sub_account:
      kind === "tng_go_plus"
        ? "go_plus"
        : kind === "tng_wallet"
          ? "wallet"
          : undefined,
    sort_id: row.id,
  };
}

export function amount_scale_for_account(
  kind: TransactionAccountKind,
): AmountScale {
  return amount_scale_for_kind(kind);
}