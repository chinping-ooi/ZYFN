"use client";

import { useMemo } from "react";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { useStatementMonth } from "@/lib/hooks/use_statement_month";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import { mbb_2_gold_combined_href } from "@/lib/credit_cards/mbb_2_gold_routes";
import {
  mbb_2_gold_card_breakdown,
  mbb_2_gold_limit_segment_sen,
} from "@/lib/credit_cards/mbb_2_gold_breakdown";
import type { MinorAmount } from "@/lib/money";
import { AccountPageHeader } from "@/components/account_page_header";
import { CashFlowSummary } from "@/components/cash_flow_summary";
import { MonthSelect } from "@/components/month_select";
import { Mbb2GoldCardBreakdownCard } from "@/components/mbb_2_gold_card_breakdown_card";
import { Mbb2GoldSharedLimitBar } from "@/components/mbb_2_gold_shared_limit_bar";

export function Mbb2GoldCombinedSummaryView({
  combined,
  visa,
  amex,
  shared_limit_sen,
}: {
  combined: AccountStatementFromDb;
  visa: AccountStatementFromDb;
  amex: AccountStatementFromDb;
  shared_limit_sen: MinorAmount | null;
}) {
  const labels = statement_kpi_labels("mbb_2_gold_combined");
  const { month, set_month, month_options } = useStatementMonth(combined.rows);

  const month_label =
    month_options.find((o) => o.value === month)?.label ?? month;

  const breakdown = useMemo(
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

  const limit_segments = useMemo(
    () => mbb_2_gold_limit_segment_sen(breakdown),
    [breakdown],
  );

  return (
    <div className="min-h-0">
      <AccountPageHeader
        title="Summary"
        view_base_path={mbb_2_gold_combined_href()}
        hide_view_tabs
        active_view="summary"
        controls={
          <MonthSelect
            label="Statement month"
            value={month}
            options={month_options}
            onChange={(v) => set_month(v as typeof month)}
          />
        }
      />
      <Mbb2GoldCardBreakdownCard
        month_label={month_label}
        rows={breakdown}
      />
      <Mbb2GoldSharedLimitBar
        limit_sen={shared_limit_sen}
        visa_used_sen={limit_segments.visa_sen}
        amex_used_sen={limit_segments.amex_sen}
      />
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
      />
    </div>
  );
}