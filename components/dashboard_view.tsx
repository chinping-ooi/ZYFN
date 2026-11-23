"use client";

import { useMemo, useState } from "react";
import {
  DEMO_ACCOUNTS,
  DEMO_DASHBOARD_SNAPSHOTS,
  DEMO_MONTH_OPTIONS,
} from "@/data/demo/dashboard_snapshots";
import { DEMO_DEPOSITS } from "@/data/demo/deposits";
import { to_fd_table_rows } from "@/data/demo/fixed_deposit_rows";
import type { MonthKey } from "@/data/types";
import { compute_spending_change } from "@/lib/spending_change";
import { format_rm } from "@/lib/money";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { CashFlowChart } from "@/components/cash_flow_chart";
import { DEPOSIT_COLUMNS } from "@/components/column_defs";
import { DataTable } from "@/components/data_table/data_table";

export function DashboardView() {
  const [month, set_month] = useState<MonthKey>("2026-11");
  const [fd_filter, set_fd_filter] = useState<"active" | "all">("active");

  const snapshot = DEMO_DASHBOARD_SNAPSHOTS[month];
  const spending_change = compute_spending_change(
    snapshot.spending_sen,
    snapshot.previous_spending_sen,
  );

  const available_sen = snapshot.account_balances_sen.reduce((a, b) => a + b, 0);

  const fd_rows = useMemo(() => {
    const all = to_fd_table_rows(DEMO_DEPOSITS, month);
    return fd_filter === "all"
      ? all
      : all.filter((d) => d.status !== "matured");
  }, [month, fd_filter]);

  const fd_total_sen = useMemo(() => {
    return DEMO_DEPOSITS.filter(
      (d) => month === "2026-10" || !d.matured,
    ).reduce((t, d) => t + d.principal_sen, 0);
  }, [month]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[17px] font-semibold">Monthly summary</h2>
          <p className="m-0 mt-0.5 text-[13px] text-zyfn-muted">
            Balances and activity as of {snapshot.as_of_label}
          </p>
        </div>
        <MonthSelect
          label="Dashboard month"
          value={month}
          options={DEMO_MONTH_OPTIONS}
          onChange={(v) => set_month(v as MonthKey)}
        />
      </div>

      <section
        className="mb-5 grid grid-cols-1 gap-[18px] md:grid-cols-3"
        aria-label="Monthly financial summary"
      >
        <KpiCard
          label="Monthly spending"
          amount_sen={snapshot.spending_sen}
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
          meta="Across 5 accounts · excludes fixed deposits"
        />
        <KpiCard
          label="Fixed deposits"
          amount_sen={fd_total_sen}
          meta={snapshot.fd_note}
        />
      </section>

      <div className="mb-5 grid grid-cols-1 gap-[18px] xl:grid-cols-[1.5fr_1fr]">
        <CashFlowChart
          labels={snapshot.chart.labels}
          income_sen={snapshot.chart.income_sen}
          spending_sen={snapshot.chart.spending_sen}
          period_note={snapshot.chart.period_note}
          monthly_income_sen={snapshot.income_sen}
          monthly_spending_sen={snapshot.spending_sen}
        />
        <section className="overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
          <div className="border-b border-zyfn-line bg-[#fafbfc] px-5 py-4">
            <h3 className="m-0 text-[15px] font-semibold">Account balances</h3>
            <p className="m-0 mt-0.5 text-xs text-zyfn-muted">
              Latest recorded balance in selected period
            </p>
          </div>
          <div className="px-5">
            {DEMO_ACCOUNTS.map((account, i) => (
              <div
                key={account.id}
                className="flex items-center gap-3 border-b border-[#dce1e7] py-3.5 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{account.name}</div>
                  <div className="text-xs text-zyfn-muted">
                    {account.type_label}
                  </div>
                </div>
                <div className="text-right text-sm font-semibold tabular-nums">
                  {format_rm(snapshot.account_balances_sen[i])}
                </div>
              </div>
            ))}
          </div>
          <p className="px-5 pb-4 text-xs text-zyfn-muted">
            GO+ is shown separately from the TNG wallet.
          </p>
        </section>
      </div>

      <section className="overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zyfn-line bg-[#fafbfc] px-5 py-4">
          <div>
            <h3 className="m-0 text-[15px] font-semibold">Fixed deposits</h3>
            <p className="m-0 mt-0.5 text-xs text-zyfn-muted">
              Track placements and upcoming maturities
            </p>
          </div>
          <div className="flex" role="group" aria-label="Fixed deposit filter">
            {(
              [
                ["active", "Active"],
                ["all", "All deposits"],
              ] as const
            ).map(([value, text]) => (
              <button
                key={value}
                type="button"
                className={`border border-[#b9c3d0] px-3 py-1.5 text-[13px] first:rounded-l-[3px] last:-ml-px last:rounded-r-[3px] ${
                  fd_filter === value
                    ? "bg-zyfn-navy border-zyfn-navy text-white"
                    : "bg-white text-[#526075]"
                }`}
                aria-pressed={fd_filter === value}
                onClick={() => set_fd_filter(value)}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 pt-4 pb-4">
          <DataTable
            label="Dashboard fixed deposits"
            scope={`dashboard-${month}-${fd_filter}`}
            columns={DEPOSIT_COLUMNS}
            rows={fd_rows}
            date_key="placed_iso"
          />
        </div>
      </section>
    </>
  );
}