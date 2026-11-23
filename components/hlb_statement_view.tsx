"use client";

import { useMemo, useState } from "react";
import {
  filter_hlb_by_month,
  hlb_month_options,
} from "@/data/demo/hong_leong";
import type { MonthKey } from "@/data/types";
import { hlb_summary } from "@/lib/statement";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { CardWithTable } from "@/components/card_with_table";
import { HLB_COLUMNS } from "@/components/column_defs";

export function HlbStatementView() {
  const [month, set_month] = useState<MonthKey | "all">("all");
  const options = hlb_month_options();

  const rows = useMemo(
    () => filter_hlb_by_month(month).sort((a, b) => a.date.localeCompare(b.date)),
    [month],
  );

  const summary = useMemo(() => hlb_summary(rows), [rows]);

  const period =
    rows.length > 0
      ? `${rows[0].date} – ${rows.at(-1)!.date}`
      : "No transactions in this period";

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[17px] font-semibold">Account statement</h2>
          <p className="m-0 mt-0.5 text-[13px] text-zyfn-muted">
            Demo sample · future source: Transaction.xlsx / HLB · {period}
          </p>
        </div>
        <MonthSelect
          label="Statement month"
          value={month}
          options={options}
          onChange={(v) => set_month(v as MonthKey | "all")}
        />
      </div>
      <section
        className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Statement summary"
      >
        <KpiCard label="Opening balance" amount_sen={summary.opening_sen} />
        <KpiCard label="Debits" amount_sen={summary.debit_sen} />
        <KpiCard label="Credits" amount_sen={summary.credit_sen} />
        <KpiCard
          label="Closing balance"
          amount_sen={summary.closing_sen}
        />
      </section>
      <CardWithTable
        title="Transaction activity"
        subtitle={`${rows.length} transactions · demo HLB data (not yet wired to Transaction.xlsx)`}
        table_label="Hong Leong Bank transactions"
        scope={`hlb-${month}`}
        columns={HLB_COLUMNS}
        rows={rows}
        date_key="date"
      />
    </>
  );
}