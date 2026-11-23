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
  },
  {
    key: "debit_micro",
    label: "Debit (RM)",
    type: "money_micro",
    account_key: "account",
    zero_as_blank: true,
  },
  {
    key: "credit_micro",
    label: "Credit (RM)",
    type: "money_micro",
    account_key: "account",
    zero_as_blank: true,
  },
  {
    key: "balance_micro",
    label: "Balance (RM)",
    type: "money_micro",
    account_key: "account",
  },
  { key: "account", label: "Account", type: "text" },
];