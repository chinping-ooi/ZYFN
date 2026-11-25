"use client";

import { DataTable } from "@/components/data_table/data_table";
import {
  transaction_columns,
  type TransactionTableRow,
} from "@/components/data_table/transaction_columns";
import type { TransactionAccountKind } from "@/lib/transactions/account_config";

export type TransactionDataTableProps = {
  label: string;
  scope: string;
  rows: TransactionTableRow[];
  kind: TransactionAccountKind;
  empty_period_message?: string;
};

/** Single table implementation for all institution transaction pages. */
export function TransactionDataTable({
  label,
  scope,
  rows,
  kind,
  empty_period_message,
}: TransactionDataTableProps) {
  return (
    <DataTable<TransactionTableRow>
      label={label}
      scope={scope}
      columns={transaction_columns(kind)}
      rows={rows}
      date_key="date"
      empty_period_message={empty_period_message}
    />
  );
}