"use client";

import { useMemo, useState } from "react";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import {
  build_transaction_statement,
  transaction_month_options,
} from "@/lib/supabase/transaction_statement";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import { StatementSummarySection } from "@/components/statement_summary_section";
import { MonthSelect } from "@/components/month_select";
import { TransactionDataTable } from "@/components/data_table/transaction_data_table";
import type { TransactionTableRow } from "@/components/data_table/transaction_columns";
import { PageToolbar } from "@/components/page_toolbar";
import { AccountTableCard } from "@/components/account_table_card";

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0">
        <PageToolbar
          title="Account statement"
          subtitle={`Supabase · ${subtitle_ref} · ${statement.period_label}`}
          controls={
            <MonthSelect
              label="Statement month"
              value={month}
              options={month_options}
              onChange={(v) => set_month(v as typeof month)}
            />
          }
        />

        <StatementSummarySection
          statement={statement}
          total_in_label={labels.total_in}
          total_out_label={labels.total_out}
          closing_label={labels.closing}
          amount_scale={data.amount_scale}
          money_dp={money_dp}
          row_count_in_view={row_count_in_view}
        />
      </div>

      <AccountTableCard title="Transaction activity" fill_height>
        <TransactionDataTable
          label={`${data.account_label} activity`}
          scope={`${data.account_ref}-${month}`}
          export_account_label={data.account_label}
          rows={table_rows}
          kind={data.account_kind}
          fill_height
        />
      </AccountTableCard>
    </div>
  );
}