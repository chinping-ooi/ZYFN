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

function kl_month_key(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

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