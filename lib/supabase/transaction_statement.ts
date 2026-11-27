import { kl_month_key } from "@/lib/datetime/kl_month_key";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import type { MinorAmount } from "@/lib/money";
import type { MicroAmount } from "@/lib/tng/money_micro";

const KL = "Asia/Kuala_Lumpur";

export type TransactionStatementSlice = {
  month: string | "all";
  period_label: string;
  total_in_sen: MinorAmount;
  total_out_sen: MinorAmount;
  closing_sen: MinorAmount;
  total_in_micro: MicroAmount;
  total_out_micro: MicroAmount;
  closing_micro: MicroAmount;
  rows: TransactionDbRow[];
};

export function transaction_month_options(rows: TransactionDbRow[]) {
  const keys = [...new Set(rows.map((row) => kl_month_key(row.date)))].sort().reverse();
  return [
    { value: "all", label: "All months" },
    ...keys.map((key) => ({
      value: key,
      label: new Intl.DateTimeFormat("en", {
        month: "long",
        year: "numeric",
        timeZone: KL,
      }).format(new Date(`${key}-01T12:00:00+08:00`)),
    })),
  ];
}

function month_key_lte(row_month: string, through_month: string): boolean {
  return row_month.localeCompare(through_month) <= 0;
}

function newest_row(rows: TransactionDbRow[]): TransactionDbRow | undefined {
  if (rows.length === 0) return undefined;
  return [...rows].sort((a, b) => {
    const by_date = b.date.localeCompare(a.date);
    if (by_date !== 0) return by_date;
    return b.sort_id - a.sort_id;
  })[0];
}

function row_closing_amounts(row: TransactionDbRow): {
  closing_sen: MinorAmount;
  closing_micro: MicroAmount;
} {
  const closing_micro =
    row.balance_micro !== 0
      ? row.balance_micro
      : row.balance_sen * 100;
  const closing_sen =
    row.balance_sen !== 0
      ? row.balance_sen
      : Math.round(row.balance_micro / 100);
  return { closing_sen, closing_micro };
}

/** Latest balance at or before the end of `through_month`; zero if none. */
export function pocket_closing_as_of_month(
  rows: TransactionDbRow[],
  through_month: string,
): { closing_sen: MinorAmount; closing_micro: MicroAmount } {
  const eligible = rows.filter((row) =>
    month_key_lte(kl_month_key(row.date), through_month),
  );
  const row = newest_row(eligible);
  if (!row) {
    return { closing_sen: 0, closing_micro: 0 };
  }
  return row_closing_amounts(row);
}

export function pocket_closing_latest(
  rows: TransactionDbRow[],
): { closing_sen: MinorAmount; closing_micro: MicroAmount } {
  const row = rows[0];
  if (!row) {
    return { closing_sen: 0, closing_micro: 0 };
  }
  return row_closing_amounts(row);
}

function kl_date_label(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: KL,
  }).format(new Date(iso));
}

/** Rows are newest-first (txn_at desc, id desc). */
export function build_transaction_statement(
  all_rows: TransactionDbRow[],
  month: string | "all",
  closing_sen_full: MinorAmount,
  closing_micro_full: MicroAmount,
): TransactionStatementSlice {
  const rows =
    month === "all"
      ? all_rows
      : all_rows.filter((row) => kl_month_key(row.date) === month);

  const total_in_sen = rows.reduce((t, row) => t + row.in_sen, 0);
  const total_out_sen = rows.reduce((t, row) => t + row.out_sen, 0);
  const total_in_micro = rows.reduce((t, row) => t + row.in_micro, 0);
  const total_out_micro = rows.reduce((t, row) => t + row.out_micro, 0);

  const closing_sen =
    month === "all"
      ? closing_sen_full
      : (rows[0]?.balance_sen ?? closing_sen_full);

  const closing_micro =
    month === "all"
      ? closing_micro_full
      : (rows[0]?.balance_micro ?? closing_micro_full);

  const period_label =
    rows.length === 0
      ? "No transactions in this period"
      : `${kl_date_label(rows.at(-1)!.date)} – ${kl_date_label(rows[0].date)}`;

  return {
    month,
    period_label,
    total_in_sen,
    total_out_sen,
    closing_sen,
    total_in_micro,
    total_out_micro,
    closing_micro,
    rows,
  };
}