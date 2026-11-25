import type { TransactionAccountKind } from "@/lib/transactions/account_config";
import type { MinorAmount } from "@/lib/money";
import type { AmountScale, TransactionDbRow } from "@/lib/supabase/transaction_rows";
import type { MicroAmount } from "@/lib/tng/money_micro";

export type SupabaseMissing = {
  kind: "missing";
  message: string;
};

export type SupabaseError = {
  kind: "error";
  message: string;
  details?: string;
};

export type AccountStatementFromDb = {
  kind: "data";
  account_ref: string;
  account_code?: string;
  account_label: string;
  account_kind: TransactionAccountKind;
  amount_scale: AmountScale;
  source: "supabase";
  rows: TransactionDbRow[];
  total_in_sen: MinorAmount;
  total_out_sen: MinorAmount;
  closing_sen: MinorAmount;
  total_in_micro: MicroAmount;
  total_out_micro: MicroAmount;
  closing_micro: MicroAmount;
  row_count: number;
};

export type AccountStatementResult =
  | AccountStatementFromDb
  | SupabaseMissing
  | SupabaseError;

/** @deprecated Use AccountStatementFromDb */
export type HlbStatementFromDb = AccountStatementFromDb & {
  account_code?: string;
};

/** @deprecated Use AccountStatementResult */
export type HlbLoadResult = AccountStatementResult;