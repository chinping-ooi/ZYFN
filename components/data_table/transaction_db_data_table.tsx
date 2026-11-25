"use client";

import { DataTable } from "@/components/data_table/data_table";
import {
  transaction_db_columns,
  type TransactionTableRow,
} from "@/components/data_table/transaction_db_columns";
import type { TransactionAccountKind } from "@/lib/transactions/account_config";

type Props = {
  label: string;
  scope: string;
  rows: TransactionTableRow[];
  kind: TransactionAccountKind;
  empty_period_message?: string;
};

export function TransactionDbDataTable({
  label,
  scope,
  rows,
  kind,
  empty_period_message,
}: Props) {
  return (
    <DataTable<TransactionTableRow>
      label={label}
      scope={scope}
      columns={transaction_db_columns(kind)}
      rows={rows}
      date_key="date"
      empty_period_message={empty_period_message}
    />
  );
}