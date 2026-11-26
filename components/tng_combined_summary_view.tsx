"use client";

import { useMemo } from "react";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { useStatementMonth } from "@/lib/hooks/use_statement_month";
import { filter_tng_rows_for_go_plus_visibility } from "@/lib/tng/combined_statement";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import { useShowGoPlus } from "@/lib/hooks/use_show_go_plus";
import { AccountPageHeader } from "@/components/account_page_header";
import { CashFlowSummary } from "@/components/cash_flow_summary";
import { MonthSelect } from "@/components/month_select";
import { ShowGoPlusCheckbox } from "@/components/show_go_plus_checkbox";
import { WalletPageControls } from "@/components/wallet_page_controls";
import { overview_includes_fd_slice } from "@/lib/wallets/overview";

export function TngCombinedSummaryView({
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
  const base_path = view_base_path ?? `/transactions/${account_slug}`;
  const labels = statement_kpi_labels(data.account_kind);
  const { show_go_plus, set_show_go_plus } = useShowGoPlus();
  const include_go_plus = wallet_toggle ? true : show_go_plus;

  const visible_rows = useMemo(
    () => filter_tng_rows_for_go_plus_visibility(data.rows, include_go_plus),
    [data.rows, include_go_plus],
  );

  const { month, set_month, month_options } = useStatementMonth(visible_rows);

  return (
    <div className="min-h-0">
      <AccountPageHeader
        title="Summary"
        view_base_path={base_path}
        active_view="summary"
        controls={
          wallet_toggle ? (
            <WalletPageControls
              month={month}
              month_options={month_options}
              on_month_change={(v) => set_month(v as typeof month)}
            />
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <ShowGoPlusCheckbox
                checked={show_go_plus}
                onChange={set_show_go_plus}
              />
              <MonthSelect
                label="Statement month"
                value={month}
                options={month_options}
                onChange={(v) => set_month(v as typeof month)}
              />
            </div>
          )
        }
      />
      <CashFlowSummary
        rows={visible_rows}
        month={month}
        amount_scale={data.amount_scale}
        total_in_label={labels.total_in}
        total_out_label={labels.total_out}
        money_dp={4}
        closing_sen={data.closing_sen}
        closing_micro={data.closing_micro}
        section_aria_label="Account summary charts"
        overview_include_fd_slice={overview_includes_fd_slice(data.account_kind)}
      />
    </div>
  );
}