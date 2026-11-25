import type { TransactionAccountKind } from "@/lib/accounts/types";

export type ImportSourceKind = "excel" | "csv" | "pdf" | "tng_text";

export type ImportRowStatus = "new" | "duplicate" | "needs_review";

export type SpreadsheetColumnMapping = {
  date: string;
  description: string;
  detail?: string;
  txn_type?: string;
  debit?: string;
  credit?: string;
  balance?: string;
};

export type NormalizedImportRow = {
  temp_id: string;
  txn_at: string;
  description: string;
  detail: string;
  txn_type: string;
  direction: "in" | "out";
  amount_major: string;
  balance_after_major: string;
  in_sen: number;
  out_sen: number;
  balance_sen: number;
  status: ImportRowStatus;
  review_reasons: string[];
};

export type ImportParseInput = {
  account_ref: string;
  account_kind: TransactionAccountKind;
  filename: string;
  kind: ImportSourceKind;
};

export type ImportConfirmRow = {
  temp_id: string;
  txn_at: string;
  description: string;
  detail: string;
  txn_type: string;
  direction: "in" | "out";
  amount_major: string;
  balance_after_major: string;
};

export type ImportConfirmResult = {
  inserted: number;
  skipped_duplicates: number;
  batch_id: number | null;
  error?: string;
};