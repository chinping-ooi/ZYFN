"use client";

import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { useStatementMonth } from "@/lib/hooks/use_statement_month";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import { overview_includes_fd_slice } from "@/lib/wallets/overview";
import { AccountPageHeader } from "@/components/account_page_header";
import { CashFlowSummary } from "@/components/cash_flow_summary";
import { WalletPageControls } from "@/components/wallet_page_controls";
import { useWorkspaceMonthOptions } from "@/components/workspace_toolbar_context";

export function TransactionSummaryView({
  data,
  wallet_toggle = false,
}: {
  data: AccountStatementFromDb;
  view_base_path?: string;
  hide_view_toggle?: boolean;
  wallet_toggle?: boolean;
}) {
  const labels = statement_kpi_labels(data.account_kind);
  const use_micro = data.amount_scale === "micro";
  const money_dp = use_micro ? 4 : 2;

  const { month, month_options } = useStatementMonth(data.rows);
  useWorkspaceMonthOptions(month_options);

  return (
    <div className="min-h-0">
      <AccountPageHeader
        title="Summary"
        controls={wallet_toggle ? <WalletPageControls /> : undefined}
      />
      <CashFlowSummary
        rows={data.rows}
        month={month}
        amount_scale={data.amount_scale}
        total_in_label={labels.total_in}
        total_out_label={labels.total_out}
        money_dp={money_dp}
        closing_sen={data.closing_sen}
        closing_micro={data.closing_micro}
        section_aria_label="Account summary charts"
        overview_include_fd_slice={overview_includes_fd_slice(data.account_kind)}
      />
    </div>
  );
}