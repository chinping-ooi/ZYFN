"use client";

import { useMemo } from "react";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";
import { useStatementMonth } from "@/lib/hooks/use_statement_month";
import { filter_tng_rows_for_go_plus_visibility } from "@/lib/tng/combined_statement";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import { useShowGoPlus } from "@/lib/hooks/use_show_go_plus";
import { AccountPageHeader } from "@/components/account_page_header";
import { AccountSummaryChartsSection } from "@/components/account_summary_charts_section";
import { MonthSelect } from "@/components/month_select";
import { ShowGoPlusCheckbox } from "@/components/show_go_plus_checkbox";

export function TngCombinedSummaryView({
  data,
  account_slug,
}: {
  data: AccountStatementFromDb;
  account_slug: string;
}) {
  const labels = statement_kpi_labels(data.account_kind);
  const { show_go_plus, set_show_go_plus } = useShowGoPlus();

  const visible_rows = useMemo(
    () => filter_tng_rows_for_go_plus_visibility(data.rows, show_go_plus),
    [data.rows, show_go_plus],
  );

  const { month, set_month, month_options } = useStatementMonth(visible_rows);

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

  return (
    <div className="min-h-0">
      <AccountPageHeader
        title="Summary"
        route_prefix="transactions"
        account_slug={account_slug}
        active_view="summary"
        controls={
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
        }
      />
      <AccountSummaryChartsSection
        statement={statement}
        total_in_label={labels.total_in}
        total_out_label={labels.total_out}
        amount_scale={data.amount_scale}
        money_dp={4}
      />
    </div>
  );
}