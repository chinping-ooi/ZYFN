"use client";

import { useMemo, useState } from "react";
import type { DashboardMetrics, MonthKey } from "@/lib/dashboard/metrics";
import { chart_window, snapshot_for_month } from "@/lib/dashboard/metrics";
import { compute_spending_change } from "@/lib/spending_change";
import { format_rm } from "@/lib/money";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { CashFlowChart } from "@/components/cash_flow_chart";

function account_type_label(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("go+")) return "Investment balance";
  if (lower.includes("tng") || lower.includes("ewallet")) return "Wallet balance";
  return "Savings account";
}

export function DashboardView({ metrics }: { metrics: DashboardMetrics }) {
  const [month, set_month] = useState<MonthKey>(metrics.default_month);

  const snapshot = snapshot_for_month(metrics, month);
  const month_index = metrics.monthly.findIndex((m) => m.month === month);
  const previous = month_index > 0 ? metrics.monthly[month_index - 1] : undefined;

  const spending_change = compute_spending_change(
    snapshot?.spending_sen ?? 0,
    previous?.spending_sen ?? 0,
  );

  const available_sen = useMemo(
    () => metrics.accounts.reduce((t, a) => t + a.balance_sen, 0),
    [metrics.accounts],
  );

  const chart = chart_window(metrics, month, 6);
  const chart_labels = chart.map((m) =>
    new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(
      new Date(`${m.month}-01T00:00:00Z`),
    ),
  );

  const net_sen =
    (snapshot?.income_sen ?? 0) - (snapshot?.spending_sen ?? 0);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[17px] font-semibold">Monthly summary</h2>
          <p className="m-0 mt-0.5 text-[13px] text-zyfn-muted">
            Supabase ledger · HLB, PBE savings, TNG eWallet, GO+ ·{" "}
            {snapshot?.label ?? month}
          </p>
        </div>
        {metrics.months.length > 0 ? (
          <MonthSelect
            label="Dashboard month"
            value={month}
            options={metrics.months}
            onChange={(v) => set_month(v)}
          />
        ) : null}
      </div>

      <section
        className="mb-5 grid grid-cols-1 gap-[18px] md:grid-cols-3"
        aria-label="Monthly financial summary"
      >
        <KpiCard
          label="Monthly spending"
          amount_sen={snapshot?.spending_sen ?? 0}
          meta={
            <span
              className={`font-semibold ${
                spending_change.direction === "up"
                  ? "text-zyfn-red"
                  : spending_change.direction === "down"
                    ? "text-zyfn-green"
                    : "text-zyfn-muted"
              }`}
            >
              {spending_change.label}
            </span>
          }
        />
        <KpiCard
          label="Available balance"
          amount_sen={available_sen}
          meta="HLB, Public Bank savings, TNG wallet, and GO+ · latest ledger balances"
        />
        <KpiCard
          label="Net cash flow"
          amount_sen={net_sen}
          meta="Credits − debits for selected month (dashboard accounts)"
        />
      </section>

      {metrics.monthly.length > 0 ? (
        <div className="mb-5 grid grid-cols-1 gap-[18px] xl:grid-cols-[1.5fr_1fr]">
          <CashFlowChart
            labels={chart_labels}
            income_sen={chart.map((m) => m.income_sen)}
            spending_sen={chart.map((m) => m.spending_sen)}
            period_note={`${chart[0]?.label ?? ""} – ${chart.at(-1)?.label ?? ""}`}
            monthly_income_sen={snapshot?.income_sen ?? 0}
            monthly_spending_sen={snapshot?.spending_sen ?? 0}
          />
          <section className="overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
            <div className="border-b border-zyfn-line bg-[#fafbfc] px-5 py-4">
              <h3 className="m-0 text-[15px] font-semibold">Account balances</h3>
              <p className="m-0 mt-0.5 text-xs text-zyfn-muted">
                Latest balance_after from each Supabase account
              </p>
            </div>
            <div className="px-5">
              {metrics.accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-3 border-b border-[#dce1e7] py-3.5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{account.name}</div>
                    <div className="text-xs text-zyfn-muted">
                      {account_type_label(account.name)}
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold tabular-nums">
                    {format_rm(account.balance_sen)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <p className="text-sm text-zyfn-muted">
          No transactions found in dashboard accounts to chart.
        </p>
      )}
    </>
  );
}