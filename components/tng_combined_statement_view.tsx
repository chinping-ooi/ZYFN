"use client";

import { useMemo } from "react";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";
import { useStatementMonth } from "@/lib/hooks/use_statement_month";
import {
  combined_tng_closing_for_statement,
  filter_tng_rows_for_go_plus_visibility,
} from "@/lib/tng/combined_statement";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import { useShowGoPlus } from "@/lib/hooks/use_show_go_plus";
import { KpiCard } from "@/components/kpi_card";
import { useWorkspaceMonthOptions } from "@/components/workspace_toolbar_context";
import { TransactionDataTable } from "@/components/data_table/transaction_data_table";
import type { TransactionTableRow } from "@/components/data_table/transaction_columns";
import { AccountPageHeader } from "@/components/account_page_header";
import { AccountTableCard } from "@/components/account_table_card";
import { ShowGoPlusCheckbox } from "@/components/show_go_plus_checkbox";
import { WalletPageControls } from "@/components/wallet_page_controls";

export function TngCombinedStatementView({
  data,
  account_slug,
  view_base_path,
  wallet_toggle = false,
}: {
  data: AccountStatementFromDb;
  account_slug: string;
  view_base_path?: string;
  wallet_toggle?: boolean;
}) {
  void view_base_path;
  void account_slug;
  const labels = statement_kpi_labels(data.account_kind);
  const { show_go_plus, set_show_go_plus } = useShowGoPlus();
  const include_go_plus = wallet_toggle ? true : show_go_plus;

  const visible_rows = useMemo(
    () => filter_tng_rows_for_go_plus_visibility(data.rows, include_go_plus),
    [data.rows, include_go_plus],
  );

  const { month, month_options } = useStatementMonth(visible_rows);
  useWorkspaceMonthOptions(month_options);

  const statement = useMemo(() => {
    const base = build_transaction_statement(
      visible_rows,
      month,
      data.closing_sen,
      data.closing_micro,
    );
    const closing = combined_tng_closing_for_statement(
      data.rows,
      month,
      data.closing_sen,
      data.closing_micro,
    );
    return {
      ...base,
      closing_sen: closing.closing_sen,
      closing_micro: closing.closing_micro,
    };
  }, [visible_rows, month, data.rows, data.closing_sen, data.closing_micro]);

  const table_rows = statement.rows as TransactionTableRow[];
  const row_count_in_view =
    month === "all" ? visible_rows.length : table_rows.length;

  return (
    <div className="flex flex-col">
      <div className="shrink-0">
        <AccountPageHeader
          title="Account statement"
          controls={
            wallet_toggle ? (
              <WalletPageControls />
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-3">
                <ShowGoPlusCheckbox
                  checked={show_go_plus}
                  onChange={set_show_go_plus}
                />
              </div>
            )
          }
        />

        <section
          className="statement-summary kpis mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Statement summary"
        >
          <KpiCard
            compact_amount
            label={labels.total_in}
            amount_micro={statement.total_in_micro}
            money_dp={4}
          />
          <KpiCard
            compact_amount
            label={labels.total_out}
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
            amount_micro={statement.closing_micro}
            money_dp={4}
          />
        </section>
      </div>

      <AccountTableCard title="Transaction activity">
        <TransactionDataTable
          label="Touch 'n Go activity"
          scope={`tng-combined-${month}-${include_go_plus ? "go" : "wallet"}`}
          export_account_label="Touch n Go"
          rows={table_rows}
          kind={data.account_kind}
          inset={false}
          show_go_plus_badge={include_go_plus}
        />
      </AccountTableCard>
    </div>
  );
}