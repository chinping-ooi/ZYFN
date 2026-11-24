import type { MinorAmount } from "@/lib/money";

export type AccountId = "hong_leong" | "public_bank";

export type SkippedRow = {
  row_number: number;
  reason: string;
};

export type LedgerTransaction = {
  date: string;
  description: string;
  debit_sen: MinorAmount;
  credit_sen: MinorAmount;
  balance_sen: MinorAmount;
  reconcile_ok: boolean;
};

export type ParsedSheet = {
  account_id: AccountId;
  account_label: string;
  sheet_name: string;
  source: "Transaction.xlsx";
  opening_balance_sen: MinorAmount;
  closing_balance_sen: MinorAmount;
  transactions: LedgerTransaction[];
  skipped_rows: SkippedRow[];
  reconcile_warning_count: number;
};

export type WorkbookData = {
  source: "Transaction.xlsx";
  loaded_at: string;
  hlb: ParsedSheet;
  pbe: ParsedSheet;
};

export type WorkbookMissing = {
  kind: "missing";
  message: string;
};

export type WorkbookError = {
  kind: "error";
  message: string;
};

export type WorkbookResult = WorkbookData | WorkbookMissing | WorkbookError;

export function is_workbook_data(
  result: WorkbookResult,
): result is WorkbookData {
  return "hlb" in result;
}