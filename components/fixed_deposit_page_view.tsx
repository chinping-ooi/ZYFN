"use client";

import { FixedDepositSummaryCards } from "@/components/fixed_deposit_summary";
import { FixedDepositDataTable } from "@/components/data_table/fixed_deposit_data_table";
import type { FixedDepositDataRow } from "@/components/data_table/fixed_deposit_columns";
import type { FixedDepositLoadResult } from "@/lib/fixed_deposits/types";
import { summarize_fixed_deposits } from "@/lib/fixed_deposits/summary";
import { to_table_rows } from "@/lib/fixed_deposits/transform";
import { PageToolbar } from "@/components/page_toolbar";
import { CardHead } from "@/components/card_head";

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
    load.source === "unconfigured"
      ? "Supabase is not configured — fixed deposit tables are empty."
      : load.empty_from_supabase
        ? "Supabase returned no rows."
        : "Loaded from Supabase.";

  return (
    <>
      <PageToolbar title={title} subtitle={`${subtitle} · ${source_note}`} />

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

      <section className="card overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
        <CardHead
          title="Deposit register"
          subtitle={`${table_rows.length} record${table_rows.length === 1 ? "" : "s"} · sorted by maturity date`}
        />
        <div className="table-wrap px-5 pt-[18px] pb-4">
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