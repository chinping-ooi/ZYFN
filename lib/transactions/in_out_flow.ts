import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import type { AmountScale } from "@/lib/supabase/transaction_rows";
import type { MinorAmount } from "@/lib/money";
import type { MicroAmount } from "@/lib/tng/money_micro";
import type { TxnTypeBreakdownRow } from "@/lib/transactions/type_breakdown";

export type InOutFlowBreakdown = {
  slices: TxnTypeBreakdownRow[];
  total_in_sen: MinorAmount;
  total_out_sen: MinorAmount;
  total_in_micro: MicroAmount;
  total_out_micro: MicroAmount;
  net_sen: MinorAmount;
  net_micro: MicroAmount;
};

/** Two-slice in vs out totals for the summary net donut (amounts only, pct of in+out). */
export function in_out_flow_breakdown(
  rows: TransactionDbRow[],
  scale: AmountScale,
  in_label: string,
  out_label: string,
): InOutFlowBreakdown {
  let total_in_sen = 0;
  let total_out_sen = 0;
  let total_in_micro = 0;
  let total_out_micro = 0;
  let in_count = 0;
  let out_count = 0;

  for (const row of rows) {
    const in_amt = scale === "micro" ? row.in_micro : row.in_sen;
    const out_amt = scale === "micro" ? row.out_micro : row.out_sen;
    if (in_amt > 0) in_count += 1;
    if (out_amt > 0) out_count += 1;
    total_in_sen += row.in_sen;
    total_out_sen += row.out_sen;
    total_in_micro += row.in_micro;
    total_out_micro += row.out_micro;
  }

  const flow_total =
    scale === "micro"
      ? total_in_micro + total_out_micro
      : total_in_sen + total_out_sen;

  const in_amount = scale === "micro" ? total_in_micro : total_in_sen;
  const out_amount = scale === "micro" ? total_out_micro : total_out_sen;

  const in_pct = flow_total > 0 ? (in_amount / flow_total) * 100 : 0;
  const out_pct = flow_total > 0 ? (out_amount / flow_total) * 100 : 0;

  const slices: TxnTypeBreakdownRow[] = [
    {
      type_key: "in",
      label: in_label,
      amount_sen: total_in_sen,
      amount_micro: total_in_micro,
      count: in_count,
      pct: in_pct,
    },
    {
      type_key: "out",
      label: out_label,
      amount_sen: total_out_sen,
      amount_micro: total_out_micro,
      count: out_count,
      pct: out_pct,
    },
  ];

  return {
    slices,
    total_in_sen,
    total_out_sen,
    total_in_micro,
    total_out_micro,
    net_sen: total_in_sen - total_out_sen,
    net_micro: total_in_micro - total_out_micro,
  };
}