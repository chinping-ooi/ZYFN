"use client";

import { useMemo, useState } from "react";
import { FixedDepositDataTable } from "@/components/data_table/fixed_deposit_data_table";
import type { FixedDepositDataRow } from "@/components/data_table/fixed_deposit_columns";
import { CardHead } from "@/components/card_head";
import type { FixedDepositRecord } from "@/lib/fixed_deposits/types";
import { to_table_rows } from "@/lib/fixed_deposits/transform";

type Filter = "active" | "all";

function SegmentedFilter({
  value,
  on_change,
}: {
  value: Filter;
  on_change: (v: Filter) => void;
}) {
  return (
    <div className="segmented flex" role="group" aria-label="Fixed deposit filter">
      {(
        [
          ["active", "Active"],
          ["all", "All deposits"],
        ] as const
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          data-filter={key}
          aria-pressed={value === key}
          className={
            value === key
              ? "border border-zyfn-navy bg-zyfn-navy px-[13px] py-1.5 text-[13px] text-white first:rounded-l-[3px] last:rounded-r-[3px]"
              : "border border-[#b9c3d0] bg-white px-[13px] py-1.5 text-[13px] text-[#526075] first:rounded-l-[3px] last:rounded-r-[3px] not-first:-ml-px"
          }
          onClick={() => on_change(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function DashboardFixedDeposits({
  rows,
}: {
  rows: FixedDepositRecord[];
}) {
  const [filter, set_filter] = useState<Filter>("active");

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === 1);
  }, [rows, filter]);

  const table_rows = useMemo(
    () => to_table_rows(filtered) as FixedDepositDataRow[],
    [filtered],
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="card mt-5 overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
      <CardHead
        title="Fixed deposits"
        subtitle="Track placements and upcoming maturities"
        align="center"
        aside={
          <SegmentedFilter value={filter} on_change={set_filter} />
        }
      />
      <div className="table-wrap px-5 pt-[18px] pb-4">
        <FixedDepositDataTable
          label="Dashboard fixed deposits"
          scope={`dashboard-fd-${filter}`}
          rows={table_rows}
          show_bank
        />
      </div>
    </section>
  );
}