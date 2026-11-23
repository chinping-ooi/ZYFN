"use client";

import { useMemo, useState } from "react";
import { DEMO_DASHBOARD_SNAPSHOTS, DEMO_MONTH_OPTIONS } from "@/data/demo/dashboard_snapshots";
import {
  demo_statement_rows,
  statement_closing_balance_index,
  type StatementAccountKey,
} from "@/data/demo/transactions";
import type { MonthKey } from "@/data/types";
import {
  build_running_balance_rows,
  statement_totals,
} from "@/lib/statement";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { CardWithTable } from "@/components/card_with_table";
import { TRANSACTION_COLUMNS } from "@/components/column_defs";

export function BankStatementView({
  account,
  title,
}: {
  account: StatementAccountKey;
  title: string;
}) {
  const [month, set_month] = useState<MonthKey>("2026-11");
  const snapshot = DEMO_DASHBOARD_SNAPSHOTS[month];

  const { rows, summary } = useMemo(() => {
    const seeds = demo_statement_rows(account, month);
    const closing =
      snapshot.account_balances_sen[statement_closing_balance_index(account)];
    const totals = statement_totals(seeds);
    const opening = closing - totals.credit_sen + totals.debit_sen;
    const rows = build_running_balance_rows(seeds, closing);
    return {
      rows,
      summary: { opening, ...totals, closing },
    };
  }, [account, month, snapshot]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[17px] font-semibold">Account statement</h2>
          <p className="m-0 mt-0.5 text-[13px] text-zyfn-muted">
            Sample records through {snapshot.as_of_label} · {title}
          </p>
        </div>
        <MonthSelect
          label="Statement month"
          value={month}
          options={DEMO_MONTH_OPTIONS}
          onChange={(v) => set_month(v as MonthKey)}
        />
      </div>
      <section
        className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Statement summary"
      >
        <KpiCard label="Opening balance" amount_sen={summary.opening} />
        <KpiCard label="Debits" amount_sen={summary.debit_sen} />
        <KpiCard label="Credits" amount_sen={summary.credit_sen} />
        <KpiCard label="Closing balance" amount_sen={summary.closing} />
      </section>
      <CardWithTable
        title="Transaction activity"
        subtitle="Illustrative statement records for this account (demo data)"
        table_label={`${title} transactions`}
        scope={`${account}-${month}`}
        columns={TRANSACTION_COLUMNS}
        rows={rows}
        date_key="date"
      />
    </>
  );
}