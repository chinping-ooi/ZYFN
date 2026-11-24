export type FixedDepositStatusCode = 0 | 1;

export type FixedDepositRecord = {
  id: number;
  account_id: number;
  bank_code: string;
  bank_label: string;
  receipt_no: string;
  principal_major: number;
  interest_rate: number;
  start_date: string;
  maturity_date: string;
  interest_earned_major: number | null;
  status: FixedDepositStatusCode;
};

export type FixedDepositTableRow = FixedDepositRecord & {
  principal_sen: number;
  interest_earned_sen: number | null;
  status_label: "Active" | "Matured";
  days_left: number | string;
};

export type FixedDepositLoadResult = {
  source: "mock" | "supabase";
  configured: boolean;
  rows: FixedDepositRecord[];
  bank_codes: string[];
  empty_from_supabase: boolean;
};

export type FixedDepositSummary = {
  active_principal_major: number;
  active_count: number;
  matured_count: number;
  next_maturity_date: string | null;
  next_maturity_receipt: string | null;
  total_interest_earned_major: number;
};