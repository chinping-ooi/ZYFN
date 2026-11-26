"use client";

import { useMemo } from "react";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";
import { useStatementMonth } from "@/lib/hooks/use_statement_month";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { WalletPageControls } from "@/components/wallet_page_controls";
import { TransactionDataTable } from "@/components/data_table/transaction_data_table";
import type { TransactionTableRow } from "@/components/data_table/transaction_columns";
import { AccountPageHeader } from "@/components/account_page_header";
import { AccountTableCard } from "@/components/account_table_card";

export function TransactionStatementView({
  data,
  view_base_path,
  wallet_toggle = false,
}: {
  data: AccountStatementFromDb;
  view_base_path: string;
  wallet_toggle?: boolean;
}) {
  const labels = statement_kpi_labels(data.account_kind);
  const use_micro = data.amount_scale === "micro";
  const money_dp = use_micro ? 4 : 2;

  const { month, set_month, month_options } = useStatementMonth(data.rows);

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

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col max-lg:h-auto lg:min-h-0 lg:h-full lg:overflow-hidden">
      <div className="min-w-0 shrink-0">
        <AccountPageHeader
          title="Account statement"
          view_base_path={view_base_path}
          active_view="statement"
          controls={
            wallet_toggle ? (
              <WalletPageControls
                month={month}
                month_options={month_options}
                on_month_change={(v) => set_month(v as typeof month)}
              />
            ) : (
              <MonthSelect
                label="Statement month"
                value={month}
                options={month_options}
                onChange={(v) => set_month(v as typeof month)}
              />
            )
          }
        />

        <section
          className="statement-summary kpis mb-5 grid gap-[18px]"
          aria-label="Statement summary"
        >
          <KpiCard
            compact_amount
            label={labels.total_in}
            amount_sen={use_micro ? null : statement.total_in_sen}
            amount_micro={use_micro ? statement.total_in_micro : null}
            money_dp={money_dp}
          />
          <KpiCard
            compact_amount
            label={labels.total_out}
            amount_sen={use_micro ? null : statement.total_out_sen}
            amount_micro={use_micro ? statement.total_out_micro : null}
            money_dp={money_dp}
          />
          <KpiCard
            compact_amount
            label="Transactions"
            meta={`${row_count_in_view} row${row_count_in_view === 1 ? "" : "s"} in view`}
          />
          <KpiCard
            compact_amount
            label={labels.closing}
            amount_sen={use_micro ? null : statement.closing_sen}
            amount_micro={use_micro ? statement.closing_micro : null}
            money_dp={money_dp}
          />
        </section>
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