"use client";

import { useMemo } from "react";
import type { TransactionStatementSlice } from "@/lib/supabase/transaction_statement";
import type { AmountScale } from "@/lib/supabase/transaction_rows";
import { txn_type_breakdown } from "@/lib/transactions/type_breakdown";
import { in_out_flow_breakdown } from "@/lib/transactions/in_out_flow";
import { StatementTypeDonutCard } from "@/components/statement_type_donut_card";
import { InOutNetDonutCard } from "@/components/in_out_net_donut_card";

export function AccountSummaryChartsSection({
  statement,
  total_in_label,
  total_out_label,
  amount_scale,
  money_dp,
}: {
  statement: TransactionStatementSlice;
  total_in_label: string;
  total_out_label: string;
  amount_scale: AmountScale;
  money_dp: 2 | 4;
}) {
  const flow = useMemo(
    () =>
      in_out_flow_breakdown(
        statement.rows,
        amount_scale,
        total_in_label,
        total_out_label,
      ),
    [statement.rows, amount_scale, total_in_label, total_out_label],
  );

  const breakdown_in = useMemo(
    () => txn_type_breakdown(statement.rows, "in", amount_scale),
    [statement.rows, amount_scale],
  );
  const breakdown_out = useMemo(
    () => txn_type_breakdown(statement.rows, "out", amount_scale),
    [statement.rows, amount_scale],
  );

  return (
    <section
      className="account-summary-charts flex flex-col gap-[18px] pb-6"
      aria-label="Account summary charts"
    >
      <InOutNetDonutCard
        rows={flow.slices}
        net_sen={flow.net_sen}
        net_micro={flow.net_micro}
        scale={amount_scale}
        money_dp={money_dp}
      />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <StatementTypeDonutCard
          title="Money in"
          rows={breakdown_in.rows}
          total_sen={statement.total_in_sen}
          total_micro={statement.total_in_micro}
          scale={amount_scale}
          money_dp={money_dp}
        />
        <StatementTypeDonutCard
          title="Money out"
          rows={breakdown_out.rows}
          total_sen={statement.total_out_sen}
          total_micro={statement.total_out_micro}
          scale={amount_scale}
          money_dp={money_dp}
        />
      </div>
    </section>
  );
}