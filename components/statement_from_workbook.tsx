"use client";

import { useMemo, useState } from "react";
import type { ParsedSheet } from "@/lib/workbook/types";
import { build_statement, statement_month_options } from "@/lib/workbook/statement";
import { KpiCard } from "@/components/kpi_card";
import { MonthSelect } from "@/components/month_select";
import { CardWithTable } from "@/components/card_with_table";
import { LEDGER_COLUMNS } from "@/components/column_defs";
import { DataQualityNotice } from "@/components/data_quality_notice";

export function StatementFromWorkbook({ sheet }: { sheet: ParsedSheet }) {
  const options = useMemo(() => statement_month_options(sheet), [sheet]);
  const [month, set_month] = useState<string | "all">(
    options[0]?.value ?? "all",
  );

  const statement = useMemo(
    () => build_statement(sheet, month),
    [sheet, month],
  );

  const warnings = sheet.reconcile_warning_count;
  const skipped = sheet.skipped_rows.length;

  return (
    <>
      <DataQualityNotice sheets={[sheet]} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-[17px] font-semibold">Account statement</h2>
          <p className="m-0 mt-0.5 text-[13px] text-zyfn-muted">
            Transaction.xlsx · {sheet.sheet_name} · {statement.period_label}
          </p>
        </div>
        <MonthSelect
          label="Statement month"
          value={month}
          options={options}
          onChange={(v) => set_month(v as typeof month)}
        />
      </div>

      <section
        className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Statement summary"
      >
        <KpiCard label="Opening balance" amount_sen={statement.opening_sen} />
        <KpiCard label="Debits" amount_sen={statement.debit_sen} />
        <KpiCard label="Credits" amount_sen={statement.credit_sen} />
        <KpiCard label="Closing balance" amount_sen={statement.closing_sen} />
      </section>

      {(skipped > 0 || warnings > 0) && (
        <p className="mb-4 text-[13px] text-zyfn-muted" role="status">
          {skipped > 0
            ? `${skipped} row${skipped === 1 ? "" : "s"} skipped in ${sheet.sheet_name}. `
            : ""}
          {warnings > 0
            ? `${warnings} balance reconciliation warning${warnings === 1 ? "" : "s"} on this sheet.`
            : ""}
        </p>
      )}

      <CardWithTable
        title="Transaction activity"
        subtitle={`${statement.rows.length} transaction${statement.rows.length === 1 ? "" : "s"} in view · source sheet ${sheet.sheet_name}`}
        table_label={`${sheet.account_label} activity`}
        scope={`${sheet.sheet_name}-${month}`}
        columns={LEDGER_COLUMNS}
        rows={statement.rows}
        date_key="date"
      />
    </>
  );
}