import type { DataTableColumn } from "@/components/data_table/types";
import type {
  BankTransaction,
  FixedDepositRow,
  FdActivityRow,
  HlbTransaction,
} from "@/data/types";

export const DEPOSIT_COLUMNS: DataTableColumn<FixedDepositRow>[] = [
  { key: "bank", label: "Bank" },
  { key: "ref", label: "Placement" },
  { key: "principal_sen", label: "Principal (RM)", type: "money" },
  { key: "rate_bps", label: "Rate p.a.", type: "rate" },
  { key: "tenure_months", label: "Tenure", type: "months" },
  { key: "placed_iso", label: "Placement date", type: "date" },
  { key: "maturity_iso", label: "Maturity date", type: "date" },
  { key: "status", label: "Status", type: "status" },
];

export const TRANSACTION_COLUMNS: DataTableColumn<BankTransaction>[] = [
  { key: "date", label: "Date", type: "date" },
  { key: "reference", label: "Reference" },
  { key: "description", label: "Description", className: "min-w-[230px] !whitespace-normal" },
  { key: "debit_sen", label: "Debit (RM)", type: "money", zero_as_blank: true },
  { key: "credit_sen", label: "Credit (RM)", type: "money", zero_as_blank: true },
  { key: "balance_sen", label: "Balance (RM)", type: "money" },
];

export const FD_ACTIVITY_COLUMNS: DataTableColumn<FdActivityRow>[] = [
  { key: "date", label: "Date", type: "date" },
  { key: "reference", label: "Placement reference" },
  { key: "event", label: "Activity" },
  {
    key: "principal_in_sen",
    label: "Principal placed (RM)",
    type: "money",
    zero_as_blank: true,
  },
  {
    key: "principal_out_sen",
    label: "Principal redeemed (RM)",
    type: "money",
    zero_as_blank: true,
  },
  {
    key: "interest_sen",
    label: "Interest received (RM)",
    type: "money",
    zero_as_blank: true,
  },
];

export const HLB_COLUMNS: DataTableColumn<HlbTransaction>[] = [
  { key: "date", label: "Date", type: "date" },
  { key: "description", label: "Description", className: "min-w-[230px] !whitespace-normal" },
  {
    key: "debit_sen",
    label: "Debit (RM)",
    type: "money",
    zero_as_blank: true,
  },
  {
    key: "credit_sen",
    label: "Credit (RM)",
    type: "money",
    zero_as_blank: true,
  },
  {
    key: "balance_sen",
    label: "Balance (RM)",
    type: "money",
  },
];