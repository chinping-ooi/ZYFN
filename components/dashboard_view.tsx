"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { CardHead } from "@/components/card_head";
import { SpendingBreakdownCard } from "@/components/spending_breakdown_card";
import type { FixedDepositSummary } from "@/lib/fixed_deposits/types";
import { count_maturing_within_days } from "@/lib/fixed_deposits/maturity";
import type { FixedDepositRecord } from "@/lib/fixed_deposits/types";

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
  fd_rows,
  statements,
}: {
  metrics: DashboardMetrics;
  fd_summary: FixedDepositSummary;
  fd_rows: FixedDepositRecord[];
  statements: AccountStatementFromDb[];
}) {
  const [month, set_month] = useState<MonthKey>(metrics.default_month);
  const chart_measure_ref = useRef<HTMLDivElement>(null);
  const [chart_height_px, set_chart_height_px] = useState<number | null>(null);

  const snapshot = snapshot_for_month(metrics, month);
  const month_index = metrics.monthly.findIndex((m) => m.month === month);
  const previous = month_index > 0 ? metrics.monthly[month_index - 1] : undefined;

  const spending_change = compute_spending_change(
    snapshot?.spending_sen ?? 0,
    previous?.spending_sen ?? 0,
  );

  const fd_principal_sen = major_to_minor(fd_summary.active_principal_major);
  const maturing_soon = count_maturing_within_days(fd_rows, 30);
  const fd_meta =
    fd_summary.active_count > 0
      ? `${fd_summary.active_count} active placement${fd_summary.active_count === 1 ? "" : "s"} · ${maturing_soon} maturing within 30 days`
      : "No active fixed deposits";

  const balance_rows = useMemo(
    () => dashboard_account_balances(statements),
    [statements],
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
  const chart_labels_key = chart_labels.join(",");

  useLayoutEffect(() => {
    const el = chart_measure_ref.current;
    if (!el) return;

    const measure = () => {
      set_chart_height_px(el.getBoundingClientRect().height);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [month, metrics.monthly.length, chart_labels_key]);

  const spending_panel_style =
    chart_height_px != null
      ? ({ height: chart_height_px } as const)
      : undefined;

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
        <div className="dashboard-layout flex flex-col gap-[18px]">
          <div className="dashboard-row-1 grid grid-cols-1 gap-[18px] min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(300px,1fr)] min-[1100px]:items-stretch">
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 min-[1100px]:grid-cols-1 min-[1100px]:grid-rows-2 min-[1100px]:h-full">
              <KpiCard
                label="Monthly spending"
                amount_sen={snapshot?.spending_sen ?? 0}
                meta={spending_meta(spending_change)}
              />
              <KpiCard
                label="Fixed deposits"
                amount_sen={fd_principal_sen}
                meta={fd_meta}
              />
            </div>
            <section className="card flex min-h-0 flex-col overflow-hidden rounded-[3px] border border-zyfn-line bg-white min-[1100px]:h-full">
              <CardHead
                title="Account balances"
                subtitle="Latest balance_after per savings account"
              />
              <div className="grid min-h-0 flex-1 grid-rows-4 px-5">
                {balance_rows.map((account) => (
                  <div
                    key={account.id}
                    className="flex min-h-0 items-center gap-3 border-b border-[#dce1e7] last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="bank-name text-sm font-semibold">
                        {account.name}
                      </div>
                      <div className="account-type text-xs text-zyfn-muted">
                        {account.sub_label}
                      </div>
                    </div>
                    <div className="account-value ml-auto text-right text-sm font-semibold tabular-nums">
                      {format_rm(account.balance_sen)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="dashboard-row-2 grid grid-cols-1 gap-[18px] min-[1100px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] min-[1100px]:items-start">
            <div ref={chart_measure_ref} className="min-h-0 w-full min-w-0">
              <CashFlowChart
                className="h-fit w-full"
                labels={chart_labels}
                income_sen={chart.map((m) => m.income_sen)}
                spending_sen={chart.map((m) => m.spending_sen)}
                period_note={`${chart[0]?.label ?? ""} – ${chart.at(-1)?.label ?? ""}`}
                monthly_income_sen={snapshot?.income_sen ?? 0}
                monthly_spending_sen={snapshot?.spending_sen ?? 0}
              />
            </div>
            <div
              className="min-h-0 w-full min-w-0 max-[1099px]:max-h-[min(70vh,640px)] min-[1100px]:overflow-hidden"
              style={spending_panel_style}
            >
              <SpendingBreakdownCard
                rows={spending_rows}
                month_label={snapshot?.label ?? month}
              />
            </div>
          </div>
        </div>
      ) : (
        <section
          className="kpis mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2"
          aria-label="Monthly financial summary"
        >
          <KpiCard
            label="Monthly spending"
            amount_sen={snapshot?.spending_sen ?? 0}
            meta={spending_meta(spending_change)}
          />
          <KpiCard
            label="Fixed deposits"
            amount_sen={fd_principal_sen}
            meta={fd_meta}
          />
        </section>
      )}
    </>
  );
}