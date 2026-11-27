"use client";

import { DataTable } from "@/components/data_table/data_table";
import {
  mbb_2_gold_breakdown_columns,
  type Mbb2GoldBreakdownDataRow,
} from "@/components/data_table/mbb_2_gold_breakdown_columns";
import type { Mbb2GoldCardBreakdownRow } from "@/lib/credit_cards/mbb_2_gold_breakdown";

export function Mbb2GoldCardBreakdownTable({
  month_label,
  rows,
}: {
  month_label: string;
  rows: Mbb2GoldCardBreakdownRow[];
}) {
  const table_rows = rows as Mbb2GoldBreakdownDataRow[];

  return (
    <div
      className="w-full border-t border-zyfn-line pt-4"
      aria-labelledby="mbb-2-gold-card-breakdown-caption"
    >
      <p
        id="mbb-2-gold-card-breakdown-caption"
        className="m-0 mb-3 text-[12px] font-semibold text-[#526075]"
      >
        Card breakdown
        <span className="font-normal text-zyfn-muted"> · {month_label}</span>
      </p>
      <DataTable<Mbb2GoldBreakdownDataRow>
        label={`MBB 2 Gold card breakdown ${month_label}`}
        scope={`mbb-2-gold-breakdown-${month_label}`}
        columns={mbb_2_gold_breakdown_columns()}
        rows={table_rows}
        empty_period_message="No card breakdown for this month."
        inset={false}
        table_layout="auto"
        export_account_label="MBB 2 Gold"
      />
    </div>
  );
}