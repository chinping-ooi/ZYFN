"use client";

import type { DataTableColumn } from "@/components/data_table/types";

/** Ledger row shape for HLB/PBE tables — keys must match workbook parser output. */
export type LedgerRow = {
  date: string;
  description: string;
  debit_sen: number;
  credit_sen: number;
  balance_sen: number;
  reconcile_ok: boolean;
};

export const LEDGER_COLUMNS: DataTableColumn<LedgerRow>[] = [
  { key: "date", label: "Date", type: "date" },
  {
    key: "description",
    label: "Description",
  },
  { key: "debit_sen", label: "Debit (RM)", type: "money", zero_as_blank: true },
  { key: "credit_sen", label: "Credit (RM)", type: "money", zero_as_blank: true },
  { key: "balance_sen", label: "Balance (RM)", type: "money" },
];