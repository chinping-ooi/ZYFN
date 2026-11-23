import type { HlbTransaction, MonthKey } from "@/data/types";
import { major_to_minor } from "@/lib/money";

/**
 * Stand-in for Transaction.xlsx / HLB sheet — replace with a parser + API later.
 * Labelled clearly as demo sample data.
 */
export const DEMO_HLB_TRANSACTIONS: HlbTransaction[] = [
  {
    date: "2026-09-02",
    description: "FUND TRANSFER",
    debit_sen: null,
    credit_sen: major_to_minor(1500),
    balance_sen: major_to_minor(4650),
  },
  {
    date: "2026-09-14",
    description: "DEBIT CARD PURCHASE",
    debit_sen: major_to_minor(62.4),
    credit_sen: null,
    balance_sen: major_to_minor(4587.6),
  },
  {
    date: "2026-10-03",
    description: "SALARY",
    debit_sen: null,
    credit_sen: major_to_minor(4200),
    balance_sen: major_to_minor(8787.6),
  },
  {
    date: "2026-10-18",
    description: "BILL PAYMENT",
    debit_sen: major_to_minor(240),
    credit_sen: null,
    balance_sen: major_to_minor(8547.6),
  },
  {
    date: "2026-11-08",
    description: "ATM WITHDRAWAL",
    debit_sen: major_to_minor(300),
    credit_sen: null,
    balance_sen: major_to_minor(8247.6),
  },
  {
    date: "2026-11-15",
    description: "INTEREST CREDIT",
    debit_sen: null,
    credit_sen: major_to_minor(4.85),
    balance_sen: major_to_minor(8252.45),
  },
];

export function filter_hlb_by_month(
  month: MonthKey | "all",
): HlbTransaction[] {
  if (month === "all") return DEMO_HLB_TRANSACTIONS;
  return DEMO_HLB_TRANSACTIONS.filter((row) => row.date.startsWith(month));
}

export function hlb_month_options(): { value: MonthKey | "all"; label: string }[] {
  const months = [
    ...new Set(DEMO_HLB_TRANSACTIONS.map((r) => r.date.slice(0, 7) as MonthKey)),
  ].sort().reverse();
  return [
    { value: "all", label: "All months" },
    ...months.map((m) => ({
      value: m,
      label: new Intl.DateTimeFormat("en", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(m + "-01T00:00:00Z")),
    })),
  ];
}