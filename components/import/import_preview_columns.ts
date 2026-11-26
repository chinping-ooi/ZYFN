"use client";

import type { DataTableColumn } from "@/components/data_table/types";

export type ImportPreviewTableRow = {
  date: string;
  txn_type: string;
  detail: string;
  description: string;
  in_sen: number;
  out_sen: number;
  balance_sen: number;
  import_status: string;
  status_hint: string;
};

export const IMPORT_PREVIEW_COLUMNS: DataTableColumn<ImportPreviewTableRow>[] = [
  { key: "date", label: "Date", type: "date" },
  { key: "txn_type", label: "Type" },
  { key: "detail", label: "Detail" },
  {
    key: "description",
    label: "Description",
    single_line: true,
  },
  { key: "in_sen", label: "In", type: "money", zero_as_blank: true },
  { key: "out_sen", label: "Out", type: "money", zero_as_blank: true },
  { key: "balance_sen", label: "Balance", type: "money" },
  { key: "import_status", label: "Status", type: "status" },
];