import { decimal_myr_to_sen } from "@/lib/supabase/decimal_to_sen";
import type { MinorAmount } from "@/lib/money";

export type HlbDbRow = {
  /** UTC instant from `txn_at` — formatted in Asia/Kuala_Lumpur in the table. */
  date: string;
  detail: string;
  txn_type: string;
  in_sen: MinorAmount;
  out_sen: MinorAmount;
  balance_sen: MinorAmount;
  /** Stable tie-break when sorting by date in the UI. */
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
};

export function map_transaction_to_hlb_row(row: ZyfnTransactionRow): HlbDbRow {
  const amount_sen = decimal_myr_to_sen(row.amount);
  return {
    date: row.txn_at,
    detail: (row.detail?.trim() || row.description?.trim() || "").trim(),
    txn_type: (row.txn_type ?? "").trim(),
    in_sen: row.direction === "in" ? amount_sen : 0,
    out_sen: row.direction === "out" ? amount_sen : 0,
    balance_sen: decimal_myr_to_sen(row.balance_after),
    sort_id: row.id,
  };
}