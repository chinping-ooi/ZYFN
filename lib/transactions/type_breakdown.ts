import { is_fd_category_text } from "@/lib/dashboard/spending_donut_fd";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import type { AmountScale } from "@/lib/supabase/transaction_rows";
import type { MinorAmount } from "@/lib/money";
import type { MicroAmount } from "@/lib/tng/money_micro";

export type TxnTypeBreakdownRow = {
  type_key: string;
  label: string;
  amount_sen: MinorAmount;
  amount_micro: MicroAmount;
  count: number;
  pct: number;
};

export type TxnTypeBreakdown = {
  rows: TxnTypeBreakdownRow[];
  total_sen: MinorAmount;
  total_micro: MicroAmount;
};

function type_label(txn_type: string): string {
  const trimmed = txn_type.trim();
  return trimmed.length > 0 ? trimmed : "Unclassified";
}

export type TxnTypeBreakdownOptions = {
  exclude_row?: (row: TransactionDbRow) => boolean;
};

/** Group in-view ledger rows by txn_type for one flow direction. */
export function txn_type_breakdown(
  rows: TransactionDbRow[],
  direction: "in" | "out",
  scale: AmountScale,
  options?: TxnTypeBreakdownOptions,
): TxnTypeBreakdown {
  const buckets = new Map<
    string,
    {
      label: string;
      amount_sen: MinorAmount;
      amount_micro: MicroAmount;
      count: number;
    }
  >();

  for (const row of rows) {
    if (options?.exclude_row?.(row)) continue;
    const amount_sen = direction === "in" ? row.in_sen : row.out_sen;
    const amount_micro = direction === "in" ? row.in_micro : row.out_micro;
    const amount = scale === "micro" ? amount_micro : amount_sen;
    if (amount <= 0) continue;

    const label = type_label(row.txn_type);
    const key = label.toLocaleLowerCase();
    const prev = buckets.get(key) ?? {
      label,
      amount_sen: 0,
      amount_micro: 0,
      count: 0,
    };
    buckets.set(key, {
      label: prev.label,
      amount_sen: prev.amount_sen + amount_sen,
      amount_micro: prev.amount_micro + amount_micro,
      count: prev.count + 1,
    });
  }

  const total_sen = [...buckets.values()].reduce(
    (t, b) => t + b.amount_sen,
    0,
  );
  const total_micro = [...buckets.values()].reduce(
    (t, b) => t + b.amount_micro,
    0,
  );
  const total = scale === "micro" ? total_micro : total_sen;

  let breakdown_rows: TxnTypeBreakdownRow[] = [...buckets.entries()]
    .map(([type_key, bucket]) => {
      const amount = scale === "micro" ? bucket.amount_micro : bucket.amount_sen;
      const pct = total > 0 ? (amount / total) * 100 : 0;
      return {
        type_key,
        label: bucket.label,
        amount_sen: bucket.amount_sen,
        amount_micro: bucket.amount_micro,
        count: bucket.count,
        pct,
      };
    })
    .sort((a, b) => {
      const a_amt = scale === "micro" ? a.amount_micro : a.amount_sen;
      const b_amt = scale === "micro" ? b.amount_micro : b.amount_sen;
      return b_amt - a_amt;
    });

  breakdown_rows = breakdown_rows.filter((row) => !is_fd_category_text(row.label));

  const total_sen_filtered = breakdown_rows.reduce(
    (t, r) => t + r.amount_sen,
    0,
  );
  const total_micro_filtered = breakdown_rows.reduce(
    (t, r) => t + r.amount_micro,
    0,
  );
  const total_filtered =
    scale === "micro" ? total_micro_filtered : total_sen_filtered;

  breakdown_rows = breakdown_rows.map((row) => {
    const amount = scale === "micro" ? row.amount_micro : row.amount_sen;
    return {
      ...row,
      pct: total_filtered > 0 ? (amount / total_filtered) * 100 : 0,
    };
  });

  return {
    rows: breakdown_rows,
    total_sen: total_sen_filtered,
    total_micro: total_micro_filtered,
  };
}