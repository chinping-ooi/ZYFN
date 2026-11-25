"use client";

import { useMemo, useState } from "react";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import {
  build_transaction_statement,
  transaction_month_options,
} from "@/lib/supabase/transaction_statement";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { TransactionDataTable } from "@/components/data_table/transaction_data_table";
import type { TransactionTableRow } from "@/components/data_table/transaction_columns";

export function TransactionStatementView({
  data,
}: {
  data: AccountStatementFromDb;
}) {
  const labels = statement_kpi_labels(data.account_kind);
  const use_micro = data.amount_scale === "micro";
  const money_dp = use_micro ? 4 : 2;

  const month_options = useMemo(
    () => transaction_month_options(data.rows),
    [data.rows],
  );
  const [month, set_month] = useState<string | "all">(
    month_options[0]?.value ?? "all",
  );

  const statement = useMemo(
    () =>
      build_transaction_statement(
        data.rows,
        month,
        data.closing_sen,
        data.closing_micro,
      ),
    [data.rows, month, data.closing_sen, data.closing_micro],
  );

  const table_rows = statement.rows as TransactionTableRow[];
  const row_count_in_view =
    month === "all" ? data.row_count : table_rows.length;

  const subtitle_ref = data.account_code ?? data.account_ref;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[17px] font-semibold">Account statement</h2>
          <p className="m-0 mt-0.5 text-[13px] text-zyfn-muted">
            Supabase · {subtitle_ref} · {statement.period_label}
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
        <KpiCard
          label={labels.total_in}
          amount_sen={use_micro ? null : statement.total_in_sen}
          amount_micro={use_micro ? statement.total_in_micro : null}
          money_dp={money_dp}
        />
        <KpiCard
          label={labels.total_out}
          amount_sen={use_micro ? null : statement.total_out_sen}
          amount_micro={use_micro ? statement.total_out_micro : null}
          money_dp={money_dp}
        />
        <KpiCard
          label="Transactions"
          hide_amount
          meta={`${row_count_in_view} row${row_count_in_view === 1 ? "" : "s"} in view`}
        />
        <KpiCard
          label={labels.closing}
          amount_sen={use_micro ? null : statement.closing_sen}
          amount_micro={use_micro ? statement.closing_micro : null}
          money_dp={money_dp}
        />
      </section>

      <section className="overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
        <div className="border-b border-zyfn-line bg-[#fafbfc] px-5 py-4">
          <h3 className="m-0 text-[15px] font-semibold">Transaction activity</h3>
          <p className="m-0 mt-0.5 text-xs text-zyfn-muted">
            {table_rows.length} transaction{table_rows.length === 1 ? "" : "s"} in
            view · read-only from public.zyfn_transactions · newest first
          </p>
        </div>
        <div className="border-t border-zyfn-line px-5 py-4">
          <TransactionDataTable
            label={`${data.account_label} activity`}
            scope={`${data.account_ref}-${month}`}
            rows={table_rows}
            kind={data.account_kind}
          />
        </div>
      </section>
    </>
  );
}