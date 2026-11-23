"use client";

import { LedgerDataTable } from "@/components/data_table/ledger_data_table";
import type { LedgerRow } from "@/components/data_table/ledger_columns";

type Props = {
  title: string;
  subtitle?: string;
  table_label: string;
  scope: string;
  rows: LedgerRow[];
  header_extra?: React.ReactNode;
};

export function CardWithTable({
  title,
  subtitle,
  table_label,
  scope,
  rows,
  header_extra,
}: Props) {
  return (
    <section className="overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zyfn-line bg-[#fafbfc] px-5 py-4">
        <div>
          <h3 className="m-0 text-[15px] font-semibold">{title}</h3>
          {subtitle ? (
            <p className="m-0 mt-0.5 text-xs text-zyfn-muted">{subtitle}</p>
          ) : null}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          {header_extra}
        </div>
      </div>
      <div className="px-5 pt-4 pb-4">
        <LedgerDataTable label={table_label} scope={scope} rows={rows} />
      </div>
    </section>
  );
}