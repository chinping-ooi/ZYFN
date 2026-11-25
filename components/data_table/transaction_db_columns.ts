"use client";

import type { DataTableColumn } from "@/components/data_table/types";
import type { TransactionAccountKind } from "@/lib/transactions/account_config";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";

export type TransactionTableRow = TransactionDbRow & Record<string, unknown>;

const DATE_COL: DataTableColumn<TransactionTableRow> = {
  key: "date",
  label: "Date",
  type: "date",
  time_zone: "Asia/Kuala_Lumpur",
};

const DETAIL_COL: DataTableColumn<TransactionTableRow> = {
  key: "detail",
  label: "Detail",
};

const TYPE_COL: DataTableColumn<TransactionTableRow> = {
  key: "txn_type",
  label: "Type",
};

export function transaction_db_columns(
  kind: TransactionAccountKind,
): DataTableColumn<TransactionTableRow>[] {
  const in_label = kind === "credit_card" ? "Credit (RM)" : "In (RM)";
  const out_label = kind === "credit_card" ? "Debit (RM)" : "Out (RM)";
  const balance_label =
    kind === "credit_card" ? "Owed (RM)" : "Balance (RM)";

  return [
    DATE_COL,
    DETAIL_COL,
    TYPE_COL,
    {
      key: "in_sen",
      label: in_label,
      type: "money",
      zero_as_blank: true,
    },
    {
      key: "out_sen",
      label: out_label,
      type: "money",
      zero_as_blank: true,
    },
    { key: "balance_sen", label: balance_label, type: "money" },
  ];
}