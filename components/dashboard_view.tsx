"use client";

import { useMemo, useState } from "react";
import type { DashboardMetrics, MonthKey } from "@/lib/dashboard/metrics";
import { chart_window, snapshot_for_month } from "@/lib/dashboard/metrics";
import { spending_breakdown_for_month } from "@/lib/dashboard/spending_breakdown";
import { dashboard_account_balances } from "@/lib/dashboard/dashboard_balances";
import { compute_spending_change } from "@/lib/spending_change";
import { format_rm, major_to_minor } from "@/lib/money";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { CashFlowChart } from "@/components/cash_flow_chart";
import { PageToolbar } from "@/components/page_toolbar";
import { SpendingBreakdownCard } from "@/components/spending_breakdown_card";
import { DashboardAccountBalancesCard } from "@/components/dashboard_account_balances_card";
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

function net_cash_flow_meta(income_sen: number, spending_sen: number) {
  return (
    <>
      Income {format_rm(income_sen)}
      {" · "}
      Spending {format_rm(spending_sen)}
    </>
  );
}

function dashboard_kpi_pair({
  spending_sen,
  spending_change,
  net_cash_flow_sen,
  income_sen,
}: {
  spending_sen: number;
  spending_change: ReturnType<typeof compute_spending_change>;
  net_cash_flow_sen: number;
  income_sen: number;
}) {
  return (
    <div
      className="grid shrink-0 grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-5"
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
        meta={net_cash_flow_meta(income_sen, spending_sen)}
      />
    </div>
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

  const kpi_pair = dashboard_kpi_pair({
    spending_sen,
    spending_change,
    net_cash_flow_sen,
    income_sen,
  });

  const chart_period = `${chart[0]?.label ?? ""} – ${chart.at(-1)?.label ?? ""}`;
  const month_label = snapshot?.label ?? month;

  return (
    <div className="flex shrink-0 flex-col">
      <PageToolbar
        title="Monthly summary"
        subtitle={
          <>
            Cash in/out only · excludes FD and internal transfers ·{" "}
            {month_label}
          </>
        }
        controls={
          metrics.months.length > 0 ? (
            <MonthSelect
              label="Dashboard month"
              value={month}
              options={metrics.months}
              onChange={(v) => set_month(v)}
            />
          ) : null
        }
      />

      {metrics.monthly.length > 0 ? (
        <div className="dashboard-layout mt-3 flex flex-col gap-4 lg:mt-4 lg:flex-row lg:items-start lg:gap-5">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-[3] lg:gap-5">
            {kpi_pair}
            <SpendingBreakdownCard
              content_sized
              className="shrink-0"
              rows={spending_rows.length > 0 ? spending_rows : []}
              month_label={month_label}
            />
            <div className="flex flex-col gap-4 lg:hidden">
              <CashFlowChart
                className="w-full shrink-0"
                fill_height
                labels={chart_labels}
                income_sen={chart.map((m) => m.income_sen)}
                spending_sen={chart.map((m) => m.spending_sen)}
                period_note={chart_period}
                monthly_income_sen={income_sen}
                monthly_spending_sen={spending_sen}
              />
              <DashboardAccountBalancesCard
                className="shrink-0"
                rows={balance_rows}
              />
            </div>
          </div>
          <div className="hidden min-w-0 flex-col gap-4 lg:flex lg:flex-[2] lg:gap-5">
            <CashFlowChart
              className="w-full shrink-0"
              fill_height
              labels={chart_labels}
              income_sen={chart.map((m) => m.income_sen)}
              spending_sen={chart.map((m) => m.spending_sen)}
              period_note={chart_period}
              monthly_income_sen={income_sen}
              monthly_spending_sen={spending_sen}
            />
            <DashboardAccountBalancesCard className="shrink-0" rows={balance_rows} />
          </div>
        </div>
      ) : (
        <div className="mt-5 shrink-0">{kpi_pair}</div>
      )}
    </div>
  );
}