"use client";

import type { DataTableColumn } from "@/components/data_table/types";
import type { TngLedgerRow } from "@/lib/tng/types";

export type TngTableRow = TngLedgerRow & Record<string, unknown>;

export const TNG_LEDGER_COLUMNS: DataTableColumn<TngTableRow>[] = [
  { key: "date", label: "Date", type: "date" },
  { key: "status", label: "Status", type: "text" },
  { key: "type", label: "Type", type: "text" },
  { key: "reference", label: "Reference" },
  {
    key: "description",
    label: "Description",
    className: "min-w-[230px] !whitespace-normal",
  },
  { key: "debit_sen", label: "Debit (RM)", type: "money", zero_as_blank: true },
  { key: "credit_sen", label: "Credit (RM)", type: "money", zero_as_blank: true },
  { key: "balance_sen", label: "Balance (RM)", type: "money" },
  { key: "account", label: "Account", type: "text" },
];