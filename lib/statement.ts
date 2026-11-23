import type { BankTransaction, HlbTransaction, MonthKey } from "@/data/types";
import type { MinorAmount } from "@/lib/money";

export function build_running_balance_rows(
  seeds: Omit<BankTransaction, "balance_sen">[],
  closing_sen: MinorAmount,
): BankTransaction[] {
  const total_debit = seeds.reduce((t, r) => t + r.debit_sen, 0);
  const total_credit = seeds.reduce((t, r) => t + r.credit_sen, 0);
  const opening = closing_sen - total_credit + total_debit;
  let running = opening;
  return seeds.map((row) => {
    running += row.credit_sen - row.debit_sen;
    return { ...row, balance_sen: running };
  });
}

export function statement_totals(rows: {
  debit_sen: MinorAmount;
  credit_sen: MinorAmount;
}[]) {
  return {
    debit_sen: rows.reduce((t, r) => t + r.debit_sen, 0),
    credit_sen: rows.reduce((t, r) => t + r.credit_sen, 0),
  };
}

export function hlb_summary(rows: HlbTransaction[]): {
  opening_sen: MinorAmount | null;
  debit_sen: MinorAmount;
  credit_sen: MinorAmount;
  closing_sen: MinorAmount | null;
} {
  const debit_sen = rows.reduce((t, r) => t + (r.debit_sen ?? 0), 0);
  const credit_sen = rows.reduce((t, r) => t + (r.credit_sen ?? 0), 0);
  const first = rows[0];
  const last = rows.at(-1);
  let opening_sen: MinorAmount | null = null;
  if (first?.balance_sen != null) {
    opening_sen =
      first.balance_sen +
      (first.debit_sen ?? 0) -
      (first.credit_sen ?? 0);
  }
  return {
    opening_sen,
    debit_sen,
    credit_sen,
    closing_sen: last?.balance_sen ?? null,
  };
}

export function parse_month_key(value: string): MonthKey {
  if (value === "2026-10" || value === "2026-11") return value;
  return "2026-11";
}