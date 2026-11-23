"use client";

import { useMemo, useState } from "react";
import type { ParsedTngDump } from "@/lib/tng/types";
import {
  build_tng_statement,
  tng_month_options,
  tng_type_options,
} from "@/lib/tng/statement";
import { format_micro_rm } from "@/lib/tng/money_micro";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { TngLedgerDataTable } from "@/components/data_table/tng_ledger_data_table";
import type { TngTableRow } from "@/components/data_table/tng_ledger_columns";

export function TngStatementView({
  dump,
  reconcile_enabled = false,
}: {
  dump: ParsedTngDump;
  reconcile_enabled?: boolean;
}) {
  const month_options = useMemo(() => tng_month_options(dump), [dump]);
  const type_options = useMemo(() => tng_type_options(dump.rows), [dump.rows]);

  const [month, set_month] = useState<string | "all">(
    month_options[0]?.value ?? "all",
  );
  const [type_filter, set_type_filter] = useState<string | "all">("all");

  const statement = useMemo(
    () => build_tng_statement(dump, month, type_filter),
    [dump, month, type_filter],
  );

  const table_rows = statement.rows as TngTableRow[];
  const skipped = dump.skipped_records.length;
  const warnings = reconcile_enabled ? dump.reconcile_warning_count : 0;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[17px] font-semibold">TNG wallet statement</h2>
          <p className="m-0 mt-0.5 text-[13px] text-zyfn-muted">
            data.txt · {statement.period_label}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthSelect
            label="Statement month"
            value={month}
            options={month_options}
            onChange={(v) => set_month(v as typeof month)}
          />
          <MonthSelect
            label="Transaction type"
            value={type_filter}
            options={type_options}
            onChange={(v) => set_type_filter(v)}
          />
        </div>
      </div>

      <section
        className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Wallet summary"
      >
        <KpiCard label="Wallet opening" amount_sen={statement.opening_sen} />
        <KpiCard label="Debits" amount_sen={statement.debit_sen} />
        <KpiCard label="Credits" amount_sen={statement.credit_sen} />
        <KpiCard label="Wallet closing" amount_sen={statement.closing_sen} />
      </section>

      <section className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2">
        <article className="rounded-[3px] border border-zyfn-line bg-white px-5 py-4">
          <div className="text-sm font-semibold text-[#526075]">GO+ balance</div>
          <div className="mt-2 text-2xl font-medium tabular-nums">
            {format_micro_rm(dump.go_plus_closing_micro, 4)}
          </div>
          <p className="mt-2 text-xs text-zyfn-muted">
            Latest GO+ balance from parsed daily earnings / cash movements
          </p>
        </article>
        {(skipped > 0 || reconcile_enabled) && (
          <article className="rounded-[3px] border border-zyfn-line bg-white px-5 py-4">
            <div className="text-sm font-semibold text-[#526075]">Parse quality</div>
            <p className="mt-2 text-sm text-zyfn-muted">
              {skipped > 0
                ? `${skipped} record${skipped === 1 ? "" : "s"} skipped. `
                : "No skipped records. "}
              {reconcile_enabled ? (
                warnings > 0 ? (
                  <>
                    {warnings} balance warning{warnings === 1 ? "" : "s"}.
                  </>
                ) : (
                  "Balances reconcile."
                )
              ) : null}
            </p>
          </article>
        )}
      </section>

      <section className="overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
        <div className="border-b border-zyfn-line bg-[#fafbfc] px-5 py-4">
          <h3 className="m-0 text-[15px] font-semibold">Wallet & GO+ activity</h3>
          <p className="m-0 mt-0.5 text-xs text-zyfn-muted">
            Transfers (GO+ / FPX / quick reload) shown but excluded from dashboard
            income and spending
          </p>
        </div>
        <div className="px-5 pt-4 pb-4">
          <TngLedgerDataTable
            label="TNG and GO+ activity"
            scope={`tng-${month}-${type_filter}`}
            rows={table_rows}
          />
        </div>
      </section>
    </>
  );
}