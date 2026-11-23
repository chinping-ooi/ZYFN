"use client";

import { useMemo, useState } from "react";
import { DEMO_DASHBOARD_SNAPSHOTS, DEMO_MONTH_OPTIONS } from "@/data/demo/dashboard_snapshots";
import { DEMO_DEPOSITS } from "@/data/demo/deposits";
import { demo_fd_activity_for_bank } from "@/data/demo/fd_activity";
import { to_fd_table_rows } from "@/data/demo/fixed_deposit_rows";
import type { MonthKey } from "@/data/types";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { CardWithTable } from "@/components/card_with_table";
import { DEPOSIT_COLUMNS, FD_ACTIVITY_COLUMNS } from "@/components/column_defs";

export function FdStatementView({ bank }: { bank: string }) {
  const [month, set_month] = useState<MonthKey>("2026-11");
  const snapshot = DEMO_DASHBOARD_SNAPSHOTS[month];

  const { placements, activity, summary } = useMemo(() => {
    const placements = DEMO_DEPOSITS.filter((d) => d.bank === bank);
    const activity = demo_fd_activity_for_bank(bank, month);
    const active_principal = placements
      .filter((d) => month === "2026-10" || !d.matured)
      .reduce((t, d) => t + d.principal_sen, 0);
    const placed = activity.reduce((t, r) => t + r.principal_in_sen, 0);
    const redeemed = activity.reduce((t, r) => t + r.principal_out_sen, 0);
    const interest = activity.reduce((t, r) => t + r.interest_sen, 0);
    return {
      placements: to_fd_table_rows(placements, month),
      activity,
      summary: {
        active_principal,
        placed,
        redeemed,
        interest,
      },
    };
  }, [bank, month]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[17px] font-semibold">
            Fixed deposit statement
          </h2>
          <p className="m-0 mt-0.5 text-[13px] text-zyfn-muted">
            Sample records through {snapshot.as_of_label} · {bank}
          </p>
        </div>
        <MonthSelect
          label="Statement month"
          value={month}
          options={DEMO_MONTH_OPTIONS}
          onChange={(v) => set_month(v as MonthKey)}
        />
      </div>
      <section
        className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Fixed deposit summary"
      >
        <KpiCard label="Active principal" amount_sen={summary.active_principal} />
        <KpiCard label="Placed this month" amount_sen={summary.placed} />
        <KpiCard label="Redeemed this month" amount_sen={summary.redeemed} />
        <KpiCard label="Interest received" amount_sen={summary.interest} />
      </section>
      <CardWithTable
        title="Deposit register"
        subtitle="Placements recorded through the selected period (demo)"
        table_label={`${bank} deposit register`}
        scope={`fd-reg-${bank}-${month}`}
        columns={DEPOSIT_COLUMNS}
        rows={placements}
        date_key="placed_iso"
      />
      <div className="mt-5">
        <CardWithTable
          title="Fixed deposit activity"
          subtitle="Principal movements and interest received during the selected month"
          table_label={`${bank} FD activity`}
          scope={`fd-act-${bank}-${month}`}
          columns={FD_ACTIVITY_COLUMNS}
          rows={activity}
          date_key="date"
        />
      </div>
    </>
  );
}