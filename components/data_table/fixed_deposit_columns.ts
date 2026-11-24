"use client";

import type { DataTableColumn } from "@/components/data_table/types";
import type { FixedDepositTableRow } from "@/lib/fixed_deposits/types";

export type FixedDepositDataRow = FixedDepositTableRow & Record<string, unknown>;

const BASE_COLUMNS: DataTableColumn<FixedDepositDataRow>[] = [
  {
    key: "receipt_no",
    label: "Receipt no.",
    headerClassName: "w-[8.5rem] min-w-[8.5rem]",
  },
  {
    key: "principal_sen",
    label: "Principal (RM)",
    type: "money",
    headerClassName: "w-[7.25rem] min-w-[7.25rem]",
  },
  {
    key: "interest_rate",
    label: "Rate",
    type: "percent",
    headerClassName: "w-[4.25rem] min-w-[4.25rem]",
  },
  {
    key: "start_date",
    label: "Start",
    type: "date",
    headerClassName: "w-[6.5rem] min-w-[6.5rem]",
  },
  {
    key: "maturity_date",
    label: "Maturity",
    type: "date",
    headerClassName: "w-[6.5rem] min-w-[6.5rem]",
  },
  {
    key: "days_left",
    label: "Days left",
    type: "text",
    headerClassName: "w-[5.25rem] min-w-[5.25rem]",
  },
  {
    key: "interest_earned_sen",
    label: "Int. earned (RM)",
    type: "money",
    zero_as_blank: true,
    headerClassName: "w-[7.5rem] min-w-[7.5rem]",
  },
  {
    key: "status_label",
    label: "Status",
    type: "status",
    headerClassName: "w-[5.25rem] min-w-[5.25rem]",
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