import type { MicroAmount } from "@/lib/tng/money_micro";
import type { MinorAmount } from "@/lib/money";

export type TngStatus = "Success" | "Pending" | "Failed" | string;

export type TngDirection = "in" | "out" | "transfer";

export type TngAccount = "wallet" | "go_plus";

export type TngLedgerRow = {
  date: string;
  status: TngStatus;
  type: string;
  reference: string;
  description: string;
  direction: TngDirection;
  account: TngAccount;
  debit_micro: MicroAmount;
  credit_micro: MicroAmount;
  balance_micro: MicroAmount;
  /** False for Pending/Failed or rows without posted amounts */
  affects_totals: boolean;
  reconcile_ok: boolean;
  /** @deprecated use debit_micro; sen for legacy callers */
  debit_sen: MinorAmount;
  credit_sen: MinorAmount;
  balance_sen: MinorAmount;
};

export type SkippedTngRecord = {
  record_index: number;
  reason: string;
};

export type ReconcileWarning = {
  record_index: number;
  account: TngAccount;
  reason: string;
};

export type ParsedTngDump = {
  source: "data.txt";
  loaded_at: string;
  wallet_closing_micro: MicroAmount;
  go_plus_closing_micro: MicroAmount;
  wallet_closing_sen: MinorAmount;
  go_plus_closing_sen: MinorAmount;
  rows: TngLedgerRow[];
  skipped_records: SkippedTngRecord[];
  reconcile_warning_count: number;
  reconcile_warnings: ReconcileWarning[];
};

export type TngMissing = {
  kind: "missing";
  message: string;
};

export type TngError = {
  kind: "error";
  message: string;
};

export type TngLoadResult = ParsedTngDump | TngMissing | TngError;

export function is_tng_data(result: TngLoadResult): result is ParsedTngDump {
  return "rows" in result;
}