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

const IMPORT_STATUS_COL: DataTableColumn<TransactionTableRow> = {
  key: "import_status",
  label: "Status",
  type: "status",
};

const IMPORT_STATUS_REASON_COL: DataTableColumn<TransactionTableRow> = {
  key: "status_hint",
  label: "Status reason",
};

const ACCOUNT_LABEL_COL: DataTableColumn<TransactionTableRow> = {
  key: "account_label",
  label: "Account",
};

export type TransactionColumnsOptions = {
  /** Import preview: append dedupe/review status after the standard ledger columns. */
  import_status?: boolean;
  /** Combined multi-card import preview. */
  account_label?: boolean;
};

/** Shared column layout for every Supabase account statement table. */
export function transaction_columns(
  kind: TransactionAccountKind,
  options?: TransactionColumnsOptions,
): DataTableColumn<TransactionTableRow>[] {
  const money_cols =
    kind === "tng_go_plus" || kind === "tng_combined"
      ? go_plus_money_columns()
      : sen_money_columns(kind);

  const cols = [DATE_COL, TYPE_COL, DETAIL_COL, DESCRIPTION_COL, ...money_cols];
  if (options?.account_label) {
    cols.splice(1, 0, ACCOUNT_LABEL_COL);
  }
  if (options?.import_status) {
    return [...cols, IMPORT_STATUS_COL, IMPORT_STATUS_REASON_COL];
  }
  return cols;
}