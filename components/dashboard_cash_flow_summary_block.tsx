"use client";

import { DashboardAccountSelect } from "@/components/dashboard_account_select";
import { DashboardAccountSummarySection } from "@/components/dashboard_account_summary_section";
import { MonthSelect } from "@/components/month_select";
import { useDashboardSummaryAccount } from "@/lib/hooks/use_dashboard_summary_account";
import type { DashboardMetrics, MonthKey } from "@/lib/dashboard/metrics";
import type { AccountStatementFromDb } from "@/lib/supabase/types";

export function DashboardCashFlowSummaryBlock({
  statements,
  month,
  on_month_change,
  month_options,
  month_label,
}: {
  statements: AccountStatementFromDb[];
  month: MonthKey;
  on_month_change: (month: MonthKey) => void;
  month_options: DashboardMetrics["months"];
  month_label: string;
}) {
  const { account_key, set_account_key, account_options } =
    useDashboardSummaryAccount();

  return (
    <section className="dashboard-summary-block mt-5 border-t border-[#dce3ec] pt-5">
      <header className="dashboard-toolbar mb-4">
        <div className="min-w-0">
          <h2 className="m-0 text-[17px] font-semibold">Account summary</h2>
          <p className="m-0 mt-[3px] text-[13px] text-zyfn-muted">
            In/out by transaction type · {month_label}
          </p>
        </div>
        {month_options.length > 0 ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DashboardAccountSelect
              label="Summary account"
              value={account_key}
              options={account_options}
              onChange={set_account_key}
            />
            <MonthSelect
              label="Summary month"
              value={month}
              options={month_options}
              onChange={(v) => on_month_change(v)}
            />
          </div>
        ) : null}
      </header>
      <DashboardAccountSummarySection
        statements={statements}
        month={month}
        account_key={account_key}
      />
    </section>
  );
}