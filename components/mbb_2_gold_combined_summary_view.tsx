"use client";

import { useMemo } from "react";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { useStatementMonth } from "@/lib/hooks/use_statement_month";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import { mbb_2_gold_card_breakdown } from "@/lib/credit_cards/mbb_2_gold_breakdown";
import { AccountPageHeader } from "@/components/account_page_header";
import { CashFlowSummary } from "@/components/cash_flow_summary";
import { overview_includes_fd_slice } from "@/lib/wallets/overview";
import { Mbb2GoldCardBreakdownTable } from "@/components/mbb_2_gold_card_breakdown_table";
import { useWorkspaceMonthOptions } from "@/components/workspace_toolbar_context";

export function Mbb2GoldCombinedSummaryView({
  combined,
  visa,
  amex,
}: {
  combined: AccountStatementFromDb;
  visa: AccountStatementFromDb;
  amex: AccountStatementFromDb;
}) {
  const labels = statement_kpi_labels("mbb_2_gold_combined");
  const { month, month_options } = useStatementMonth(combined.rows);
  useWorkspaceMonthOptions(month_options);

  const month_label =
    month_options.find((o) => o.value === month)?.label ?? month;

  const breakdown_rows = useMemo(
    () =>
      mbb_2_gold_card_breakdown(
        month,
        visa.rows,
        amex.rows,
        combined.rows,
        visa.closing_sen,
        amex.closing_sen,
      ),
    [month, visa.rows, amex.rows, combined.rows, visa.closing_sen, amex.closing_sen],
  );

  const overview_footer = (
    <Mbb2GoldCardBreakdownTable
      month_label={month_label}
      rows={breakdown_rows}
    />
  );

  return (
    <div>
      <AccountPageHeader title="Summary" />
      <CashFlowSummary
        rows={combined.rows}
        month={month}
        amount_scale={combined.amount_scale}
        total_in_label={labels.total_in}
        total_out_label={labels.total_out}
        money_dp={2}
        closing_sen={combined.closing_sen}
        closing_micro={combined.closing_micro}
        section_aria_label="Account summary charts"
        overview_footer={overview_footer}
        overview_include_fd_slice={overview_includes_fd_slice(combined.account_kind)}
      />
    </div>
  );
}