"use client";

import { DataTable } from "@/components/data_table/data_table";
import {
  LEDGER_COLUMNS,
  type LedgerRow,
} from "@/components/data_table/ledger_columns";

type Props = {
  label: string;
  scope: string;
  rows: LedgerRow[];
  empty_period_message?: string;
};

/** Statement ledger table — columns stay in the client bundle (not RSC props). */
export function LedgerDataTable({
  label,
  scope,
  rows,
  empty_period_message,
}: Props) {
  return (
    <DataTable<LedgerRow>
      label={label}
      scope={scope}
      columns={LEDGER_COLUMNS}
      rows={rows}
      date_key="date"
      empty_period_message={empty_period_message}
    />
  );
}