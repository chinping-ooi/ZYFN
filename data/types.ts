import type { MinorAmount } from "@/lib/money";
import type { FdStatus } from "@/lib/fd_status";

export type MonthKey = "2026-10" | "2026-11";

export type DashboardSnapshot = {
  month_key: MonthKey;
  label: string;
  as_of_label: string;
  as_of_iso: string;
  spending_sen: MinorAmount;
  previous_spending_sen: MinorAmount;
  income_sen: MinorAmount;
  account_balances_sen: MinorAmount[];
  chart: {
    labels: string[];
    income_sen: MinorAmount[];
    spending_sen: MinorAmount[];
    period_note: string;
  };
  fd_note: string;
};

export type AccountMeta = {
  id: string;
  name: string;
  type_label: string;
};

export type FixedDepositRecord = {
  bank: string;
  ref: string;
  principal_sen: MinorAmount;
  rate_bps: number;
  tenure_months: number;
  placed_iso: string;
  maturity_iso: string;
  matured?: boolean;
  due?: boolean;
};

export type FixedDepositRow = FixedDepositRecord & {
  status: FdStatus;
};

export type BankTransaction = {
  date: string;
  reference: string;
  description: string;
  debit_sen: MinorAmount;
  credit_sen: MinorAmount;
  balance_sen: MinorAmount;
};

export type FdActivityRow = {
  date: string;
  reference: string;
  event: string;
  principal_in_sen: MinorAmount;
  principal_out_sen: MinorAmount;
  interest_sen: MinorAmount;
};

export type HlbTransaction = {
  date: string;
  description: string;
  debit_sen: MinorAmount | null;
  credit_sen: MinorAmount | null;
  balance_sen: MinorAmount | null;
};