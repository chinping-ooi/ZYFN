"use client";

import { useMemo } from "react";
import type { TransactionStatementSlice } from "@/lib/supabase/transaction_statement";
import type { AmountScale } from "@/lib/supabase/transaction_rows";
import { txn_type_breakdown } from "@/lib/transactions/type_breakdown";
import { StatementTypeDonutCard } from "@/components/statement_type_donut_card";
import { KpiCard } from "@/components/kpi_card";

export function StatementSummarySection({
  statement,
  total_in_label,
  total_out_label,
  closing_label,
  amount_scale,
  money_dp,
  row_count_in_view,
}: {
  statement: TransactionStatementSlice;
  total_in_label: string;
  total_out_label: string;
  closing_label: string;
  amount_scale: AmountScale;
  money_dp: 2 | 4;
  row_count_in_view: number;
}) {
  const use_micro = amount_scale === "micro";

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
      className="statement-summary mb-5 flex flex-col gap-[18px]"
      aria-label="Statement summary"
    >
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <StatementTypeDonutCard
          title={total_in_label}
          rows={breakdown_in.rows}
          total_sen={statement.total_in_sen}
          total_micro={statement.total_in_micro}
          scale={amount_scale}
          money_dp={money_dp}
        />
        <StatementTypeDonutCard
          title={total_out_label}
          rows={breakdown_out.rows}
          total_sen={statement.total_out_sen}
          total_micro={statement.total_out_micro}
          scale={amount_scale}
          money_dp={money_dp}
        />
      </div>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2">
        <KpiCard
          compact_amount
          label="Transactions"
          meta={`${row_count_in_view} row${row_count_in_view === 1 ? "" : "s"} in view`}
        />
        <KpiCard
          compact_amount
          label={closing_label}
          amount_sen={use_micro ? null : statement.closing_sen}
          amount_micro={use_micro ? statement.closing_micro : null}
          money_dp={money_dp}
        />
      </div>
    </section>
  );
}