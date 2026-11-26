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
  include_fd_slice?: boolean;
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
    include_fd_slice = true,
  } = params;

  const in_amount = scale === "micro" ? total_in_micro : total_in_sen;
  const out_amount = scale === "micro" ? total_out_micro : total_out_sen;
  const fd_amount = scale === "micro" ? total_fd_out_micro : total_fd_out_sen;

  const pct = (part: number, flow_total: number) =>
    flow_total > 0 ? (part / flow_total) * 100 : 0;

  const slices: TxnTypeBreakdownRow[] = [
    {
      type_key: "in",
      label: in_label,
      amount_sen: total_in_sen,
      amount_micro: total_in_micro,
      count: in_count,
      pct: 0,
    },
    {
      type_key: "out",
      label: out_label,
      amount_sen: total_out_sen,
      amount_micro: total_out_micro,
      count: out_count,
      pct: 0,
    },
  ];

  if (include_fd_slice) {
    const flow_total = in_amount + out_amount + fd_amount;
    slices[0].pct = pct(in_amount, flow_total);
    slices[1].pct = pct(out_amount, flow_total);
    slices.push({
      type_key: "fd",
      label: fd_label,
      amount_sen: total_fd_out_sen,
      amount_micro: total_fd_out_micro,
      count: fd_count,
      pct: pct(fd_amount, flow_total),
    });
  } else {
    const out_combined = out_amount + fd_amount;
    const flow_total = in_amount + out_combined;
    slices[0].pct = pct(in_amount, flow_total);
    slices[1].pct = pct(out_combined, flow_total);
  }

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
export type InOutFlowBreakdownOptions = {
  fd_label?: string;
  /** When false, all out (including FD) is in the out slice (wallet Overview). */
  include_fd_slice?: boolean;
};

export function in_out_flow_breakdown(
  rows: TransactionDbRow[],
  scale: AmountScale,
  in_label: string,
  out_label: string,
  options?: InOutFlowBreakdownOptions,
): InOutFlowBreakdown {
  const fd_label = options?.fd_label ?? "FD";
  const include_fd_slice = options?.include_fd_slice ?? true;
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
      if (include_fd_slice && is_fd) {
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
    include_fd_slice,
  });
}