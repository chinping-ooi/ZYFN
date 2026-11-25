"use client";

import { useMemo, useState } from "react";
import type { HlbStatementFromDb } from "@/lib/supabase/types";
import {
  build_hlb_statement,
  hlb_month_options,
} from "@/lib/supabase/hlb_statement";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { HlbDbDataTable } from "@/components/data_table/hlb_db_data_table";
import type { HlbTableRow } from "@/components/data_table/hlb_db_columns";

export function HlbStatementFromSupabase({ data }: { data: HlbStatementFromDb }) {
  const month_options = useMemo(() => hlb_month_options(data.rows), [data.rows]);
  const [month, set_month] = useState<string | "all">(
    month_options[0]?.value ?? "all",
  );

  const statement = useMemo(
    () => build_hlb_statement(data.rows, month, data.closing_sen),
    [data.rows, month, data.closing_sen],
  );

  const table_rows = statement.rows as HlbTableRow[];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[17px] font-semibold">Account statement</h2>
          <p className="m-0 mt-0.5 text-[13px] text-zyfn-muted">
            Supabase · {data.account_code} · {statement.period_label}
          </p>
        </div>
        <MonthSelect
          label="Statement month"
          value={month}
          options={month_options}
          onChange={(v) => set_month(v as typeof month)}
        />
      </div>

      <section
        className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Statement summary"
      >
        <KpiCard label="Total in" amount_sen={statement.total_in_sen} />
        <KpiCard label="Total out" amount_sen={statement.total_out_sen} />
        <KpiCard
          label="Transactions"
          hide_amount
          meta={`${month === "all" ? data.row_count : table_rows.length} row${(month === "all" ? data.row_count : table_rows.length) === 1 ? "" : "s"} in view`}
        />
        <KpiCard label="Current balance" amount_sen={statement.closing_sen} />
      </section>

      <section className="overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
        <div className="border-b border-zyfn-line bg-[#fafbfc] px-5 py-4">
          <h3 className="m-0 text-[15px] font-semibold">Transaction activity</h3>
          <p className="m-0 mt-0.5 text-xs text-zyfn-muted">
            {table_rows.length} transaction{table_rows.length === 1 ? "" : "s"} in
            view · read-only from public.zyfn_transactions
          </p>
        </div>
        <div className="border-t border-zyfn-line px-5 py-4">
          <HlbDbDataTable
            label={`${data.account_label} activity`}
            scope={`hlb-db-${month}`}
            rows={table_rows}
          />
        </div>
      </section>
    </>
  );
}