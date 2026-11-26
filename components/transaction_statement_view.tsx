"use client";

import { useMemo, useState } from "react";
import type { AccountRoutePrefix } from "@/lib/accounts/types";
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
import { AccountPageHeader } from "@/components/account_page_header";
import { AccountTableCard } from "@/components/account_table_card";

export function TransactionStatementView({
  data,
  route_prefix,
  account_slug,
}: {
  data: AccountStatementFromDb;
  route_prefix: AccountRoutePrefix;
  account_slug: string;
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
        <AccountPageHeader
          title="Account statement"
          subtitle={`Supabase · ${subtitle_ref} · ${statement.period_label}`}
          route_prefix={route_prefix}
          account_slug={account_slug}
          active_view="statement"
          controls={
            <MonthSelect
              label="Statement month"
              value={month}
              options={month_options}
              onChange={(v) => set_month(v as typeof month)}
            />
          }
        />

        <section
          className="statement-summary kpis mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
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