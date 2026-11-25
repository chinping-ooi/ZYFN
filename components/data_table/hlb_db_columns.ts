"use client";

import type { DataTableColumn } from "@/components/data_table/types";
import type { HlbDbRow } from "@/lib/supabase/hlb_rows";

export type HlbTableRow = HlbDbRow & Record<string, unknown>;

export const HLB_DB_COLUMNS: DataTableColumn<HlbTableRow>[] = [
  {
    key: "date",
    label: "Date",
    type: "date",
    time_zone: "Asia/Kuala_Lumpur",
  },
  { key: "detail", label: "Detail" },
  { key: "txn_type", label: "Type" },
  {
    key: "in_sen",
    label: "In (RM)",
    type: "money",
    zero_as_blank: true,
  },
  {
    key: "out_sen",
    label: "Out (RM)",
    type: "money",
    zero_as_blank: true,
  },
  { key: "balance_sen", label: "Balance (RM)", type: "money" },
];