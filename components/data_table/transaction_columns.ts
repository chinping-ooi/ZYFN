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

const DESCRIPTION_COL: DataTableColumn<TransactionTableRow> = {
  key: "description",
  label: "Description",
};

const TYPE_COL: DataTableColumn<TransactionTableRow> = {
  key: "txn_type",
  label: "Type",
};

const DETAIL_COL: DataTableColumn<TransactionTableRow> = {
  key: "detail",
  label: "Detail",
};

function sen_money_columns(
  kind: TransactionAccountKind,
): DataTableColumn<TransactionTableRow>[] {
  const in_label = kind === "credit_card" ? "Credit" : "In";
  const out_label = kind === "credit_card" ? "Debit" : "Out";
  const balance_label = kind === "credit_card" ? "Owed" : "Balance";

  return [
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

function go_plus_money_columns(): DataTableColumn<TransactionTableRow>[] {
  return [
    {
      key: "in_micro",
      label: "In",
      type: "money_micro",
      account_key: "tng_sub_account",
      zero_as_blank: true,
    },
    {
      key: "out_micro",
      label: "Out",
      type: "money_micro",
      account_key: "tng_sub_account",
      zero_as_blank: true,
    },
    {
      key: "balance_micro",
      label: "Balance",
      type: "money_micro",
      account_key: "tng_sub_account",
    },
  ];
}

/** Shared column layout for every Supabase account statement table. */
export function transaction_columns(
  kind: TransactionAccountKind,
): DataTableColumn<TransactionTableRow>[] {
  const money_cols =
    kind === "tng_go_plus" ? go_plus_money_columns() : sen_money_columns(kind);

  return [DATE_COL, TYPE_COL, DETAIL_COL, DESCRIPTION_COL, ...money_cols];
}