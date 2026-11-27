import type { DashboardMetrics } from "@/lib/dashboard/metrics";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { FixedDepositSummary } from "@/lib/fixed_deposits/types";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";

/** Representative dashboard data for layout screenshots (not real bank data). */
export const MOCK_FD_SUMMARY: FixedDepositSummary = {
  active_count: 3,
  active_principal_major: 125000.5,
  matured_count: 1,
  next_maturity_date: "2027-01-15",
  next_maturity_receipt: "FD-2026-001",
  next_maturity_principal_major: 50000,
  next_maturity_days_left: 45,
  total_interest_earned_major: 4200,
};

export const MOCK_METRICS: DashboardMetrics = {
  default_month: "2026-11",
  months: [
    { value: "2026-06", label: "June 2026" },
    { value: "2026-07", label: "July 2026" },
    { value: "2026-08", label: "August 2026" },
    { value: "2026-09", label: "September 2026" },
    { value: "2026-10", label: "October 2026" },
    { value: "2026-11", label: "November 2026" },
  ],
  accounts: [],
  monthly: [
    { month: "2026-06", label: "June 2026", income_sen: 820_000, spending_sen: 410_000 },
    { month: "2026-07", label: "July 2026", income_sen: 795_000, spending_sen: 520_000 },
    { month: "2026-08", label: "August 2026", income_sen: 810_000, spending_sen: 480_000 },
    { month: "2026-09", label: "September 2026", income_sen: 800_000, spending_sen: 455_000 },
    { month: "2026-10", label: "October 2026", income_sen: 805_000, spending_sen: 590_000 },
    { month: "2026-11", label: "November 2026", income_sen: 120_100, spending_sen: 385_400 },
  ],
};

function mock_spending_row(
  date: string,
  out_sen: number,
  sort_id: number,
): TransactionDbRow {
  return {
    date,
    description: "Sample expense",
    detail: "",
    txn_type: "debit",
    in_sen: 0,
    out_sen,
    balance_sen: 0,
    in_micro: 0,
    out_micro: 0,
    balance_micro: 0,
    sort_id,
  };
}

const NOV = "2026-11-12T04:00:00.000Z";

function spread(amount_sen: number, n: number, start_id: number): TransactionDbRow[] {
  const each = Math.floor(amount_sen / n);
  return Array.from({ length: n }, (_, i) =>
    mock_spending_row(NOV, each, start_id + i),
  );
}

export const MOCK_STATEMENTS: AccountStatementFromDb[] = [
  {
    kind: "data",
    account_ref: "PBE_SAVINGS",
    account_label: "Public Bank",
    account_kind: "bank",
    amount_scale: "sen",
    source: "supabase",
    rows: spread(120_000, 4, 1),
    total_in_sen: 0,
    total_out_sen: 120_000,
    closing_sen: 12_450_00,
    total_in_micro: 0,
    total_out_micro: 0,
    closing_micro: 0,
    row_count: 4,
  },
  {
    kind: "data",
    account_ref: "HLB",
    account_label: "Hong Leong Bank",
    account_kind: "bank",
    amount_scale: "sen",
    source: "supabase",
    rows: spread(72_000, 3, 10),
    total_in_sen: 0,
    total_out_sen: 72_000,
    closing_sen: 8_200_00,
    total_in_micro: 0,
    total_out_micro: 0,
    closing_micro: 0,
    row_count: 3,
  },
  {
    kind: "data",
    account_ref: "MBB_SAVINGS",
    account_label: "Maybank",
    account_kind: "bank",
    amount_scale: "sen",
    source: "supabase",
    rows: spread(32_400, 2, 20),
    total_in_sen: 0,
    total_out_sen: 32_400,
    closing_sen: 15_600_00,
    total_in_micro: 0,
    total_out_micro: 0,
    closing_micro: 0,
    row_count: 2,
  },
  {
    kind: "data",
    account_ref: "MBB_VISA_1697",
    account_label: "MBB Visa 1697",
    account_kind: "credit_card",
    amount_scale: "sen",
    source: "supabase",
    rows: spread(95_000, 5, 30),
    total_in_sen: 0,
    total_out_sen: 95_000,
    closing_sen: 4_200_00,
    total_in_micro: 0,
    total_out_micro: 0,
    closing_micro: 0,
    row_count: 5,
  },
  {
    kind: "data",
    account_ref: "PBE_MASTERCARD_6357",
    account_label: "Public Bank Quantum MasterCard 6357",
    account_kind: "credit_card",
    amount_scale: "sen",
    source: "supabase",
    rows: spread(18_000, 2, 40),
    total_in_sen: 0,
    total_out_sen: 18_000,
    closing_sen: 2_100_00,
    total_in_micro: 0,
    total_out_micro: 0,
    closing_micro: 0,
    row_count: 2,
  },
  {
    kind: "data",
    account_ref: "TNG_EWALLET",
    account_label: "TNG eWallet",
    account_kind: "tng_wallet",
    amount_scale: "sen",
    source: "supabase",
    rows: spread(30_000, 4, 50),
    total_in_sen: 0,
    total_out_sen: 30_000,
    closing_sen: 320_00,
    total_in_micro: 0,
    total_out_micro: 0,
    closing_micro: 0,
    row_count: 4,
  },
  {
    kind: "data",
    account_ref: "TNG_GO_PLUS",
    account_label: "TNG GO+",
    account_kind: "tng_go_plus",
    amount_scale: "micro",
    source: "supabase",
    rows: [
      {
        date: NOV,
        description: "Sample GO+",
        detail: "",
        txn_type: "debit",
        in_sen: 0,
        out_sen: 0,
        balance_sen: 0,
        in_micro: 0,
        out_micro: 1_800_0000,
        balance_micro: 1_250_0000,
        sort_id: 60,
      },
    ],
    total_in_sen: 0,
    total_out_sen: 0,
    closing_sen: 0,
    total_in_micro: 0,
    total_out_micro: 1_800_0000,
    closing_micro: 1_250_0000,
    row_count: 1,
  },
];