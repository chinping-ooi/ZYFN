"use client";

import { FixedDepositSummaryCards } from "@/components/fixed_deposit_summary";
import { FixedDepositDataTable } from "@/components/data_table/fixed_deposit_data_table";
import type { FixedDepositDataRow } from "@/components/data_table/fixed_deposit_columns";
import type { FixedDepositLoadResult } from "@/lib/fixed_deposits/types";
import { summarize_fixed_deposits } from "@/lib/fixed_deposits/summary";
import { to_table_rows } from "@/lib/fixed_deposits/transform";

export function FixedDepositPageView({
  title,
  subtitle,
  load,
  table_scope,
  show_bank_column,
}: {
  title: string;
  subtitle: string;
  load: FixedDepositLoadResult;
  table_scope: string;
  show_bank_column: boolean;
}) {
  const summary = summarize_fixed_deposits(load.rows);
  const table_rows = to_table_rows(load.rows) as FixedDepositDataRow[];

  const source_note =
    load.source === "mock"
      ? "Showing illustrative sample data (Supabase env not set)."
      : load.empty_from_supabase
        ? "Supabase returned no rows."
        : "Loaded from Supabase.";

  return (
    <>
      <FixedDepositPageHeader
        title={title}
        subtitle={subtitle}
        source_note={source_note}
      />

      {load.configured && load.empty_from_supabase ? (
        <aside
          className="mb-5 rounded-[3px] border border-[#decea9] bg-[#faf6ec] px-4 py-3 text-sm text-[#805e23]"
          role="status"
        >
          No fixed deposits were returned. Row Level Security is enabled on{" "}
          <code className="text-xs">zyfn_accounts</code> and{" "}
          <code className="text-xs">zyfn_fixed_deposits</code> — add a{" "}
          <code className="text-xs">SELECT</code> policy for the publishable
          role (see deployment notes) before live data appears.
        </aside>
      ) : null}

      <FixedDepositSummaryCards summary={summary} />

      <section className="overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
        <div className="border-b border-zyfn-line bg-[#fafbfc] px-5 py-4">
          <h3 className="m-0 text-[15px] font-semibold">Deposit register</h3>
          <p className="m-0 mt-0.5 text-xs text-zyfn-muted">
            {table_rows.length} record{table_rows.length === 1 ? "" : "s"} ·
            sorted by maturity date
          </p>
        </div>
        <div className="border-t border-zyfn-line px-5 py-4">
          <FixedDepositDataTable
            label={title}
            scope={table_scope}
            rows={table_rows}
            show_bank={show_bank_column}
          />
        </div>
      </section>
    </>
  );
}

function FixedDepositPageHeader({
  title,
  subtitle,
  source_note,
}: {
  title: string;
  subtitle: string;
  source_note: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
      <p className="m-0 mt-0.5 text-[13px] text-zyfn-muted">{subtitle}</p>
      <p className="m-0 mt-1 text-xs text-zyfn-muted">{source_note}</p>
    </div>
  );
}