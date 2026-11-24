"use client";

import type { DataTableColumn } from "@/components/data_table/types";
import type { FixedDepositTableRow } from "@/lib/fixed_deposits/types";

export type FixedDepositDataRow = FixedDepositTableRow & Record<string, unknown>;

const BASE_COLUMNS: DataTableColumn<FixedDepositDataRow>[] = [
  { key: "receipt_no", label: "Receipt no." },
  {
    key: "principal_sen",
    label: "Principal (RM)",
    type: "money",
  },
  {
    key: "interest_rate",
    label: "Rate",
    type: "percent",
  },
  { key: "start_date", label: "Start", type: "date" },
  { key: "maturity_date", label: "Maturity", type: "date" },
  {
    key: "days_left",
    label: "Days left",
    type: "text",
    headerClassName: "w-[5.5rem] max-w-[5.5rem]",
  },
  {
    key: "interest_earned_sen",
    label: "Interest earned (RM)",
    type: "money",
    zero_as_blank: true,
  },
  {
    key: "status_label",
    label: "Status",
    type: "status",
    headerClassName: "w-[5.5rem] max-w-[5.5rem]",
  },
];

export function fixed_deposit_columns(
  show_bank: boolean,
): DataTableColumn<FixedDepositDataRow>[] {
  if (!show_bank) return BASE_COLUMNS;
  return [
    {
      key: "bank_label",
      label: "Bank",
      headerClassName: "w-[7rem] max-w-[7rem]",
    },
    ...BASE_COLUMNS,
  ];
}