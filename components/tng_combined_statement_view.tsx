"use client";

import { useMemo, useState } from "react";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import {
  build_transaction_statement,
  transaction_month_options,
} from "@/lib/supabase/transaction_statement";
import { filter_tng_rows_for_go_plus_visibility } from "@/lib/tng/combined_statement";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import { use_hide_amounts } from "@/lib/hooks/use_hide_amounts";
import { use_show_go_plus } from "@/lib/hooks/use_show_go_plus";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { TransactionDataTable } from "@/components/data_table/transaction_data_table";
import type { TransactionTableRow } from "@/components/data_table/transaction_columns";
import { PageToolbar } from "@/components/page_toolbar";
import { AccountTableCard } from "@/components/account_table_card";
import { ShowGoPlusCheckbox } from "@/components/show_go_plus_checkbox";

export function TngCombinedStatementView({
  data,
}: {
  data: AccountStatementFromDb;
}) {
  const labels = statement_kpi_labels(data.account_kind);
  const { amounts_hidden } = use_hide_amounts();
  const { show_go_plus } = use_show_go_plus();

  const visible_rows = useMemo(
    () => filter_tng_rows_for_go_plus_visibility(data.rows, show_go_plus),
    [data.rows, show_go_plus],
  );

  const month_options = useMemo(
    () => transaction_month_options(visible_rows),
    [visible_rows],
  );
  const [month, set_month] = useState<string | "all">(
    month_options[0]?.value ?? "all",
  );

  const statement = useMemo(
    () =>
      build_transaction_statement(
        visible_rows,
        month,
        data.closing_sen,
        data.closing_micro,
      ),
    [visible_rows, month, data.closing_sen, data.closing_micro],
  );

  const table_rows = statement.rows as TransactionTableRow[];
  const row_count_in_view =
    month === "all" ? visible_rows.length : table_rows.length;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0">
        <PageToolbar
          title="Account statement"
          subtitle={`Supabase · TNG · ${statement.period_label}`}
          controls={
            <div className="flex flex-wrap items-center justify-end gap-3">
              <ShowGoPlusCheckbox />
              <MonthSelect
                label="Statement month"
                value={month}
                options={month_options}
                onChange={(v) => set_month(v as typeof month)}
              />
            </div>
          }
        />

        <section
          className="statement-summary kpis mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Statement summary"
        >
          <KpiCard
            compact_amount
            label={labels.total_in}
            hide_amount={amounts_hidden}
            amount_micro={statement.total_in_micro}
            money_dp={4}
          />
          <KpiCard
            compact_amount
            label={labels.total_out}
            hide_amount={amounts_hidden}
            amount_micro={statement.total_out_micro}
            money_dp={4}
          />
          <KpiCard
            compact_amount
            label="Transactions"
            meta={`${row_count_in_view} row${row_count_in_view === 1 ? "" : "s"} in view`}
          />
          <KpiCard
            compact_amount
            label={labels.closing}
            hide_amount={amounts_hidden}
            amount_sen={statement.closing_sen}
          />
        </section>
      </div>

      <AccountTableCard title="Transaction activity" fill_height>
        <TransactionDataTable
          label="Touch 'n Go activity"
          scope={`tng-combined-${month}-${show_go_plus ? "go" : "wallet"}`}
          export_account_label="Touch n Go"
          rows={table_rows}
          kind={data.account_kind}
          fill_height
          mask_amounts={amounts_hidden}
          show_go_plus_badge={show_go_plus}
        />
      </AccountTableCard>
    </div>
  );
}