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
  debit_sen: MinorAmount;
  credit_sen: MinorAmount;
  balance_sen: MinorAmount;
  reconcile_ok: boolean;
};

export type SkippedTngRecord = {
  record_index: number;
  reason: string;
};

export type ParsedTngDump = {
  source: "data.txt";
  loaded_at: string;
  wallet_closing_sen: MinorAmount;
  go_plus_closing_sen: MinorAmount;
  rows: TngLedgerRow[];
  skipped_records: SkippedTngRecord[];
  reconcile_warning_count: number;
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