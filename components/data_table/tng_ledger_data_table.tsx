"use client";

import { DataTable } from "@/components/data_table/data_table";
import {
  TNG_LEDGER_COLUMNS,
  type TngTableRow,
} from "@/components/data_table/tng_ledger_columns";

type Props = {
  label: string;
  scope: string;
  rows: TngTableRow[];
  empty_period_message?: string;
};

export function TngLedgerDataTable({
  label,
  scope,
  rows,
  empty_period_message,
}: Props) {
  return (
    <DataTable<TngTableRow>
      label={label}
      scope={scope}
      columns={TNG_LEDGER_COLUMNS}
      rows={rows}
      date_key="date"
      empty_period_message={empty_period_message}
    />
  );
}