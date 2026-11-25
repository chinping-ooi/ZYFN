"use client";

import { useMemo, useState } from "react";
import type { DashboardMetrics, MonthKey } from "@/lib/dashboard/metrics";
import { chart_window, snapshot_for_month } from "@/lib/dashboard/metrics";
import { spending_breakdown_for_month } from "@/lib/dashboard/spending_breakdown";
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

function account_type_label(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("go+")) return "Investment balance";
  if (lower.includes("tng") || lower.includes("ewallet")) return "Wallet balance";
  return "Savings account";
}

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

  const snapshot = snapshot_for_month(metrics, month);
  const month_index = metrics.monthly.findIndex((m) => m.month === month);
  const previous = month_index > 0 ? metrics.monthly[month_index - 1] : undefined;

  const spending_change = compute_spending_change(
    snapshot?.spending_sen ?? 0,
    previous?.spending_sen ?? 0,
  );

  const cash_accounts = useMemo(
    () => metrics.accounts.filter((a) => a.kind !== "credit_card"),
    [metrics.accounts],
  );

  const available_sen = useMemo(
    () => cash_accounts.reduce((t, a) => t + a.balance_sen, 0),
    [cash_accounts],
  );

  const fd_principal_sen = major_to_minor(fd_summary.active_principal_major);
  const maturing_soon = count_maturing_within_days(fd_rows, 30);
  const fd_meta =
    fd_summary.active_count > 0
      ? `${fd_summary.active_count} active placement${fd_summary.active_count === 1 ? "" : "s"} · ${maturing_soon} maturing within 30 days`
      : "No active fixed deposits";

  const spending_breakdown = useMemo(
    () => spending_breakdown_for_month(statements, month),
    [statements, month],
  );

  const chart = chart_window(metrics, month, 6);
  const chart_labels = chart.map((m) =>
    new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(
      new Date(`${m.month}-01T00:00:00Z`),
    ),
  );

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

      <section
        className="kpis mb-5 grid grid-cols-1 items-stretch gap-[18px] md:grid-cols-3"
        aria-label="Monthly financial summary"
      >
        <KpiCard
          label="Monthly spending"
          amount_sen={snapshot?.spending_sen ?? 0}
          meta={spending_meta(spending_change)}
        />
        <KpiCard
          label="Available balance"
          amount_sen={available_sen}
          meta={`Across ${cash_accounts.length} accounts · excludes fixed deposits and cards`}
        />
        <KpiCard
          label="Fixed deposits"
          amount_sen={fd_principal_sen}
          meta={fd_meta}
        />
      </section>

      {metrics.monthly.length > 0 ? (
        <div className="middle mb-5 grid grid-cols-1 items-start gap-[18px] xl:grid-cols-[minmax(0,1.5fr)_minmax(330px,1fr)] xl:items-start">
          <div className="min-h-0 w-full self-start">
          <CashFlowChart
            labels={chart_labels}
            income_sen={chart.map((m) => m.income_sen)}
            spending_sen={chart.map((m) => m.spending_sen)}
            period_note={`${chart[0]?.label ?? ""} – ${chart.at(-1)?.label ?? ""}`}
            monthly_income_sen={snapshot?.income_sen ?? 0}
            monthly_spending_sen={snapshot?.spending_sen ?? 0}
          />
          </div>
          <div className="flex min-h-0 min-w-0 w-full flex-col gap-[18px] self-start">
            <section className="card overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
              <CardHead
                title="Account balances"
                subtitle="Latest recorded balance in selected period"
              />
              <div className="accounts px-5">
                {metrics.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="account flex items-center gap-3 border-b border-[#dce1e7] py-3.5 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="bank-name text-sm font-semibold">
                        {account.name}
                      </div>
                      <div className="account-type text-xs text-zyfn-muted">
                        {account_type_label(account.name)}
                      </div>
                    </div>
                    <div className="account-value ml-auto text-right text-sm font-semibold tabular-nums">
                      {format_rm(account.balance_sen)}
                    </div>
                  </div>
                ))}
              </div>
              <p className="account-note px-5 pb-[15px] pt-2 text-xs text-zyfn-muted">
                GO+ is shown separately from the TNG wallet.
              </p>
            </section>
            <SpendingBreakdownCard
              rows={spending_breakdown}
              month_label={snapshot?.label ?? month}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-zyfn-muted">
          No transactions found in dashboard accounts to chart.
        </p>
      )}
    </>
  );
}