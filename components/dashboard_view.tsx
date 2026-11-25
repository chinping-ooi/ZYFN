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
      className="grid h-full min-h-0 grid-cols-1 items-stretch gap-5 sm:grid-cols-2"
      aria-label="Monthly financial summary"
    >
      <KpiCard
        label="Monthly spending"
        amount_sen={spending_sen}
        meta={spending_meta(spending_change)}
      />
      <KpiCard
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

  return (
    <>
      <PageToolbar
        title="Monthly summary"
        subtitle={
          <>
            Cash in/out only · excludes FD and internal transfers ·{" "}
            {snapshot?.label ?? month}
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
        <div
          className="dashboard-layout mt-5 grid min-h-[min(520px,calc(100vh-12rem))] grid-cols-1 gap-5 min-[1100px]:grid-cols-2 min-[1100px]:grid-rows-[auto_minmax(0,1fr)]"
        >
          <div className="min-h-0 min-[1100px]:row-start-1 min-[1100px]:h-full">
            {kpi_pair}
          </div>
          <DashboardAccountBalancesCard
            className="min-h-0 min-[1100px]:row-start-1 min-[1100px]:h-full"
            rows={balance_rows}
          />
          <CashFlowChart
            className="min-h-[280px] w-full min-[1100px]:row-start-2 min-[1100px]:min-h-0 min-[1100px]:h-full"
            fill_height
            labels={chart_labels}
            income_sen={chart.map((m) => m.income_sen)}
            spending_sen={chart.map((m) => m.spending_sen)}
            period_note={`${chart[0]?.label ?? ""} – ${chart.at(-1)?.label ?? ""}`}
            monthly_income_sen={income_sen}
            monthly_spending_sen={spending_sen}
          />
          <SpendingBreakdownCard
            className="min-h-[280px] min-[1100px]:row-start-2 min-[1100px]:min-h-0 min-[1100px]:h-full"
            rows={spending_rows}
            month_label={snapshot?.label ?? month}
          />
        </div>
      ) : (
        <div className="mt-5">{kpi_pair}</div>
      )}
    </>
  );
}