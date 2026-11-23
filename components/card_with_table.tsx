"use client";

import type { DataTableColumn } from "@/components/data_table/types";
import { DataTable } from "@/components/data_table/data_table";

type Props<T extends Record<string, unknown>> = {
  title: string;
  subtitle?: string;
  table_label: string;
  scope: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  date_key?: keyof T & string;
  header_extra?: React.ReactNode;
  toolbar?: React.ReactNode;
};

export function CardWithTable<T extends Record<string, unknown>>({
  title,
  subtitle,
  table_label,
  scope,
  columns,
  rows,
  date_key,
  header_extra,
}: Props<T>) {
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
        <DataTable
          label={table_label}
          scope={scope}
          columns={columns}
          rows={rows}
          date_key={date_key}
        />
      </div>
    </section>
  );
}