import type { AccountMeta, DashboardSnapshot } from "@/data/types";
import { major_to_minor } from "@/lib/money";

export const DEMO_ACCOUNTS: AccountMeta[] = [
  { id: "maybank", name: "Maybank", type_label: "Savings account" },
  { id: "public_bank", name: "Public Bank", type_label: "Savings account" },
  {
    id: "hong_leong",
    name: "Hong Leong Bank",
    type_label: "Savings account",
  },
  { id: "tng", name: "TNG eWallet", type_label: "Wallet balance" },
  { id: "go_plus", name: "GO+", type_label: "Investment balance" },
];

/** Monthly dashboard KPIs and chart series (demo). */
export const DEMO_DASHBOARD_SNAPSHOTS: Record<
  DashboardSnapshot["month_key"],
  DashboardSnapshot
> = {
  "2026-11": {
    month_key: "2026-11",
    label: "November 2026",
    as_of_label: "20 November 2026",
    as_of_iso: "2026-11-20",
    spending_sen: major_to_minor(2140),
    previous_spending_sen: major_to_minor(2380),
    income_sen: major_to_minor(5800),
    account_balances_sen: [
      major_to_minor(6450),
      major_to_minor(12000),
      major_to_minor(3280),
      major_to_minor(850),
      major_to_minor(3500),
    ],
    chart: {
      labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
      income_sen: [
        major_to_minor(5200),
        major_to_minor(5500),
        major_to_minor(5800),
        major_to_minor(5600),
        major_to_minor(5800),
        major_to_minor(5800),
      ],
      spending_sen: [
        major_to_minor(2680),
        major_to_minor(3100),
        major_to_minor(2450),
        major_to_minor(2590),
        major_to_minor(2380),
        major_to_minor(2140),
      ],
      period_note: "Jun – Nov 2026 · November to date",
    },
    fd_note: "3 active placements · 1 maturing within 30 days",
  },
  "2026-10": {
    month_key: "2026-10",
    label: "October 2026",
    as_of_label: "31 October 2026",
    as_of_iso: "2026-10-31",
    spending_sen: major_to_minor(2380),
    previous_spending_sen: major_to_minor(2590),
    income_sen: major_to_minor(5800),
    account_balances_sen: [
      major_to_minor(6990),
      major_to_minor(17000),
      major_to_minor(3150),
      major_to_minor(920),
      major_to_minor(3310),
    ],
    chart: {
      labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
      income_sen: [
        major_to_minor(5100),
        major_to_minor(5200),
        major_to_minor(5500),
        major_to_minor(5800),
        major_to_minor(5600),
        major_to_minor(5800),
      ],
      spending_sen: [
        major_to_minor(2800),
        major_to_minor(2680),
        major_to_minor(3100),
        major_to_minor(2450),
        major_to_minor(2590),
        major_to_minor(2380),
      ],
      period_note: "May – Oct 2026",
    },
    fd_note: "4 active placements · 2 maturing within 30 days",
  },
};

export const DEMO_MONTH_OPTIONS = Object.values(DEMO_DASHBOARD_SNAPSHOTS).map(
  (s) => ({ value: s.month_key, label: s.label }),
);