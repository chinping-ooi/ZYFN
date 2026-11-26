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
  fill_height?: boolean;
  export_account_label?: string;
  loading?: boolean;
  /** Import preview only — appends Status column via shared column builder. */
  show_import_status?: boolean;
};

/** Single table implementation for all institution transaction pages. */
export function TransactionDataTable({
  label,
  scope,
  rows,
  kind,
  empty_period_message,
  fill_height = false,
  export_account_label,
  loading,
  show_import_status = false,
}: TransactionDataTableProps) {
  return (
    <DataTable<TransactionTableRow>
      label={label}
      scope={scope}
      columns={transaction_columns(kind, {
        import_status: show_import_status,
      })}
      rows={rows}
      date_key="date"
      empty_period_message={empty_period_message}
      fill_height={fill_height}
      inset={!fill_height}
      export_account_label={export_account_label}
      loading={loading}
      skeleton_variant="transaction"
    />
  );
}