"use client";

import { useMemo, useState } from "react";
import type { AccountRoutePrefix } from "@/lib/accounts/types";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import {
  build_transaction_statement,
  transaction_month_options,
} from "@/lib/supabase/transaction_statement";
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

  const subtitle_ref = data.account_code ?? data.account_ref;

  return (
    <div className="min-h-0">
      <AccountPageHeader
        title="Summary"
        subtitle={`Supabase · ${subtitle_ref} · ${statement.period_label}`}
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