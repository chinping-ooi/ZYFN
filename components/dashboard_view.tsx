"use client";

import { useMemo, useState } from "react";
import type { DashboardMetrics, MonthKey } from "@/lib/dashboard/metrics";
import { chart_window, snapshot_for_month } from "@/lib/dashboard/metrics";
import { spending_breakdown_for_month } from "@/lib/dashboard/spending_breakdown";
import { dashboard_account_balances } from "@/lib/dashboard/dashboard_balances";
import { compute_spending_change } from "@/lib/spending_change";
import { major_to_minor } from "@/lib/money";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { CashFlowChart } from "@/components/cash_flow_chart";
import { SpendingBreakdownCard } from "@/components/spending_breakdown_card";
import { DashboardAccountBalancesCard } from "@/components/dashboard_account_balances_card";
import { DashboardAccountSelect } from "@/components/dashboard_account_select";
import { DashboardAccountSummarySection } from "@/components/dashboard_account_summary_section";
import { useDashboardSummaryAccount } from "@/lib/hooks/use_dashboard_summary_account";
import type { FixedDepositSummary } from "@/lib/fixed_deposits/types";

function spending_meta(change: ReturnType<typeof compute_spending_change>) {
  if (change.direction === "flat") {
    return change.label;
  }
  const pct = `${Math.abs(change.pct).toFixed(1)}%`;
  const word = change.direction === "down" ? "lower" : "higher";
  return (
    <>
      <span
        className={`font-semibold ${
          change.direction === "down" ? "text-zyfn-green" : "text-zyfn-red"
        }`}
      >
        {pct} {word}{" "}
      </span>
      vs. previous month
    </>
  );
}

export function DashboardView({
  metrics,
  fd_summary,
  statements,
}: {
  metrics: DashboardMetrics;
  fd_summary: FixedDepositSummary;
  statements: AccountStatementFromDb[];
}) {
  const [month, set_month] = useState<MonthKey>(metrics.default_month);
  const { account_key, set_account_key, account_options } =
    useDashboardSummaryAccount();

  const snapshot = snapshot_for_month(metrics, month);
  const month_index = metrics.monthly.findIndex((m) => m.month === month);
  const previous = month_index > 0 ? metrics.monthly[month_index - 1] : undefined;

  const income_sen = snapshot?.income_sen ?? 0;
  const spending_sen = snapshot?.spending_sen ?? 0;
  const net_cash_flow_sen = income_sen - spending_sen;

  const spending_change = compute_spending_change(
    spending_sen,
    previous?.spending_sen ?? 0,
  );

  const fd_principal_sen = major_to_minor(fd_summary.active_principal_major);

  const balance_rows = useMemo(
    () =>
      dashboard_account_balances(
        statements,
        fd_principal_sen,
        fd_summary.active_count,
      ),
    [statements, fd_principal_sen, fd_summary.active_count],
  );

  const spending_rows = useMemo(
    () => spending_breakdown_for_month(statements, month),
    [statements, month],
  );

  const chart = chart_window(metrics, month, 6);
  const chart_labels = chart.map((m) =>
    new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(
      new Date(`${m.month}-01T00:00:00Z`),
    ),
  );

  const chart_period = `${chart[0]?.label ?? ""} – ${chart.at(-1)?.label ?? ""}`;
  const month_label = snapshot?.label ?? month;

  const chart_props = {
    fill_height: true as const,
    cell_fill: true as const,
    labels: chart_labels,
    income_sen: chart.map((m) => m.income_sen),
    spending_sen: chart.map((m) => m.spending_sen),
    period_note: chart_period,
    monthly_income_sen: income_sen,
    monthly_spending_sen: spending_sen,
  };

  return (
    <div className="dashboard-shell lg:flex-1">
      <header className="dashboard-toolbar">
        <div className="min-w-0">
          <h2 className="m-0 text-[17px] font-semibold">Monthly summary</h2>
          <p className="m-0 mt-[3px] text-[13px] text-zyfn-muted">
            Cash in/out only · excludes FD and internal transfers · {month_label}
          </p>
        </div>
        {metrics.months.length > 0 ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <DashboardAccountSelect
              label="Summary account"
              value={account_key}
              options={account_options}
              onChange={set_account_key}
            />
            <MonthSelect
              label="Dashboard month"
              value={month}
              options={metrics.months}
              onChange={(v) => set_month(v)}
            />
          </div>
        ) : null}
      </header>

      {metrics.monthly.length > 0 ? (
        <>
          <section
            className="mb-5"
            aria-label="Account summary charts"
          >
            <DashboardAccountSummarySection
              statements={statements}
              month={month}
              account_key={account_key}
            />
          </section>

          <div className="dashboard-columns" data-gap-check="body">
            <div className="dashboard-column dashboard-column-left">
              <div
                className="dashboard-kpi-row"
                aria-label="Monthly financial summary"
              >
                <KpiCard
                  compact_amount
                  snug
                  label="Monthly spending"
                  amount_sen={spending_sen}
                  meta={spending_meta(spending_change)}
                />
                <KpiCard
                  compact_amount
                  snug
                  label="Net cash flow"
                  amount_sen={net_cash_flow_sen}
                  meta={<>Excludes FD · {month_label}</>}
                />
              </div>
              <SpendingBreakdownCard
                content_sized
                column_fill
                className="min-h-0"
                rows={spending_rows.length > 0 ? spending_rows : []}
                month_label={month_label}
              />
            </div>
            <div className="dashboard-column dashboard-column-right">
              <CashFlowChart className="min-h-0 flex-1" {...chart_props} />
              <DashboardAccountBalancesCard
                column_fill
                className="min-h-0 flex-1"
                rows={balance_rows}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}