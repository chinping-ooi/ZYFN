"use client";

import { useMemo } from "react";
import type { AccountRoutePrefix } from "@/lib/accounts/types";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";
import { useStatementMonth } from "@/lib/hooks/use_statement_month";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import { AccountPageHeader } from "@/components/account_page_header";
import { AccountSummaryChartsSection } from "@/components/account_summary_charts_section";
import { MonthSelect } from "@/components/month_select";

export function TransactionSummaryView({
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

  return (
    <div className="min-h-0">
      <AccountPageHeader
        title="Summary"
        route_prefix={route_prefix}
        account_slug={account_slug}
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
      <AccountSummaryChartsSection
        statement={statement}
        total_in_label={labels.total_in}
        total_out_label={labels.total_out}
        amount_scale={data.amount_scale}
        money_dp={money_dp}
      />
    </div>
  );
}