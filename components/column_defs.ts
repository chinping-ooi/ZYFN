import type { DataTableColumn } from "@/components/data_table/types";
import type { LedgerTransaction } from "@/lib/workbook/types";

export const LEDGER_COLUMNS: DataTableColumn<LedgerTransaction>[] = [
  { key: "date", label: "Date", type: "date" },
  {
    key: "description",
    label: "Description",
    className: "min-w-[230px] !whitespace-normal",
  },
  { key: "debit_sen", label: "Debit (RM)", type: "money", zero_as_blank: true },
  { key: "credit_sen", label: "Credit (RM)", type: "money", zero_as_blank: true },
  { key: "balance_sen", label: "Balance (RM)", type: "money" },
];