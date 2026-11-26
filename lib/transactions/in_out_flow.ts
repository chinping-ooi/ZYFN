import { is_fixed_deposit_daily_chart_row } from "@/lib/dashboard/spending_donut_fd";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import type { AmountScale } from "@/lib/supabase/transaction_rows";
import type { MinorAmount } from "@/lib/money";
import type { MicroAmount } from "@/lib/tng/money_micro";
import type { TxnTypeBreakdownRow } from "@/lib/transactions/type_breakdown";

export type InOutFlowBreakdown = {
  slices: TxnTypeBreakdownRow[];
  total_in_sen: MinorAmount;
  /** Non-FD money out (cash-flow spending on account views, ledger out there). */
  total_out_sen: MinorAmount;
  total_fd_out_sen: MinorAmount;
  total_in_micro: MicroAmount;
  total_out_micro: MicroAmount;
  total_fd_out_micro: MicroAmount;
  net_sen: MinorAmount;
  net_micro: MicroAmount;
};

export function build_overview_flow_slices(params: {
  scale: AmountScale;
  in_label: string;
  out_label: string;
  fd_label: string;
  total_in_sen: number;
  total_out_sen: number;
  total_fd_out_sen: number;
  total_in_micro: number;
  total_out_micro: number;
  total_fd_out_micro: number;
  in_count: number;
  out_count: number;
  fd_count: number;
}): InOutFlowBreakdown {
  const {
    scale,
    in_label,
    out_label,
    fd_label,
    total_in_sen,
    total_out_sen,
    total_fd_out_sen,
    total_in_micro,
    total_out_micro,
    total_fd_out_micro,
    in_count,
    out_count,
    fd_count,
  } = params;

  const in_amount = scale === "micro" ? total_in_micro : total_in_sen;
  const out_amount = scale === "micro" ? total_out_micro : total_out_sen;
  const fd_amount = scale === "micro" ? total_fd_out_micro : total_fd_out_sen;
  const flow_total = in_amount + out_amount + fd_amount;

  const pct = (part: number) => (flow_total > 0 ? (part / flow_total) * 100 : 0);

  const slices: TxnTypeBreakdownRow[] = [
    {
      type_key: "in",
      label: in_label,
      amount_sen: total_in_sen,
      amount_micro: total_in_micro,
      count: in_count,
      pct: pct(in_amount),
    },
    {
      type_key: "out",
      label: out_label,
      amount_sen: total_out_sen,
      amount_micro: total_out_micro,
      count: out_count,
      pct: pct(out_amount),
    },
    {
      type_key: "fd",
      label: fd_label,
      amount_sen: total_fd_out_sen,
      amount_micro: total_fd_out_micro,
      count: fd_count,
      pct: pct(fd_amount),
    },
  ];

  return {
    slices,
    total_in_sen,
    total_out_sen,
    total_fd_out_sen,
    total_in_micro,
    total_out_micro,
    total_fd_out_micro,
    net_sen: total_in_sen - total_out_sen,
    net_micro: total_in_micro - total_out_micro,
  };
}

/**
 * In vs out vs FD for the Overview donut. Centre net = in − out (out slice excludes FD).
 */
export function in_out_flow_breakdown(
  rows: TransactionDbRow[],
  scale: AmountScale,
  in_label: string,
  out_label: string,
  fd_label = "FD",
): InOutFlowBreakdown {
  let total_in_sen = 0;
  let total_out_sen = 0;
  let total_fd_out_sen = 0;
  let total_in_micro = 0;
  let total_out_micro = 0;
  let total_fd_out_micro = 0;
  let in_count = 0;
  let out_count = 0;
  let fd_count = 0;

  for (const row of rows) {
    const is_fd = is_fixed_deposit_daily_chart_row(row);

    if (row.in_sen > 0 || row.in_micro > 0) {
      total_in_sen += row.in_sen;
      total_in_micro += row.in_micro;
      in_count += 1;
    }

    if (row.out_sen > 0 || row.out_micro > 0) {
      if (is_fd) {
        total_fd_out_sen += row.out_sen;
        total_fd_out_micro += row.out_micro;
        fd_count += 1;
      } else {
        total_out_sen += row.out_sen;
        total_out_micro += row.out_micro;
        out_count += 1;
      }
    }
  }

  return build_overview_flow_slices({
    scale,
    in_label,
    out_label,
    fd_label,
    total_in_sen,
    total_out_sen,
    total_fd_out_sen,
    total_in_micro,
    total_out_micro,
    total_fd_out_micro,
    in_count,
    out_count,
    fd_count,
  });
}