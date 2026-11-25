"use client";

import { DataTable } from "@/components/data_table/data_table";
import {
  HLB_DB_COLUMNS,
  type HlbTableRow,
} from "@/components/data_table/hlb_db_columns";

type Props = {
  label: string;
  scope: string;
  rows: HlbTableRow[];
  empty_period_message?: string;
};

export function HlbDbDataTable({
  label,
  scope,
  rows,
  empty_period_message,
}: Props) {
  return (
    <DataTable<HlbTableRow>
      label={label}
      scope={scope}
      columns={HLB_DB_COLUMNS}
      rows={rows}
      date_key="date"
      empty_period_message={empty_period_message}
    />
  );
}