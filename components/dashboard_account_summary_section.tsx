"use client";

import { useMemo } from "react";
import type { MonthKey } from "@/lib/dashboard/metrics";
import {
  dashboard_summary_amount_scale,
  dashboard_summary_kpi_labels,
  dashboard_summary_money_dp,
  dashboard_summary_source_rows,
} from "@/lib/dashboard/dashboard_summary";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { CashFlowSummary } from "@/components/cash_flow_summary";

export function DashboardAccountSummarySection({
  statements,
  month,
  account_key,
}: {
  statements: AccountStatementFromDb[];
  month: MonthKey;
  account_key: string;
}) {
  const source_rows = useMemo(
    () => dashboard_summary_source_rows(statements, account_key),
    [statements, account_key],
  );

  const amount_scale = useMemo(
    () => dashboard_summary_amount_scale(account_key, statements),
    [account_key, statements],
  );

  const labels = useMemo(
    () => dashboard_summary_kpi_labels(account_key, statements),
    [account_key, statements],
  );

  const money_dp = dashboard_summary_money_dp(amount_scale);

  return (
    <CashFlowSummary
      rows={source_rows}
      month={month}
      amount_scale={amount_scale}
      total_in_label={labels.total_in}
      total_out_label={labels.total_out}
      money_dp={money_dp}
      section_aria_label="Account summary charts"
      className="pb-0"
    />
  );
}