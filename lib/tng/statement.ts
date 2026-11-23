import type { ParsedTngDump, TngLedgerRow } from "@/lib/tng/types";
import { micro_to_sen_display } from "@/lib/tng/money_micro";
import type { MinorAmount } from "@/lib/money";

export type TngStatementSlice = {
  month: string | "all";
  type_filter: string | "all";
  period_label: string;
  opening_sen: MinorAmount | null;
  debit_sen: MinorAmount;
  credit_sen: MinorAmount;
  closing_sen: MinorAmount | null;
  rows: TngLedgerRow[];
};

export function tng_type_options(rows: TngLedgerRow[]) {
  const types = [...new Set(rows.map((r) => r.type))].sort();
  return [
    { value: "all", label: "All types" },
    ...types.map((t) => ({ value: t, label: t })),
  ];
}

export function tng_month_options(dump: ParsedTngDump) {
  const keys = [
    ...new Set(dump.rows.map((row) => row.date.slice(0, 7))),
  ].sort().reverse();
  return [
    { value: "all", label: "All months" },
    ...keys.map((key) => ({
      value: key,
      label: new Intl.DateTimeFormat("en", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${key}-01T00:00:00Z`)),
    })),
  ];
}

export function build_tng_statement(
  dump: ParsedTngDump,
  month: string | "all",
  type_filter: string | "all",
): TngStatementSlice {
  let rows = dump.rows;
  if (month !== "all") {
    rows = rows.filter((row) => row.date.startsWith(month));
  }
  if (type_filter !== "all") {
    rows = rows.filter((row) => row.type === type_filter);
  }

  const wallet_rows = rows.filter(
    (r) => r.account === "wallet" && r.affects_totals,
  );
  const posting = rows.filter((r) => r.affects_totals);

  const debit_micro = posting.reduce((t, row) => t + row.debit_micro, 0);
  const credit_micro = posting.reduce((t, row) => t + row.credit_micro, 0);

  let opening_sen: MinorAmount | null = null;
  let closing_sen: MinorAmount | null = dump.wallet_closing_sen;

  if (wallet_rows.length > 0) {
    const first = wallet_rows[0];
    opening_sen = micro_to_sen_display(
      first.balance_micro + first.debit_micro - first.credit_micro,
    );
    closing_sen = micro_to_sen_display(wallet_rows.at(-1)!.balance_micro);
  }

  const period_label =
    rows.length === 0
      ? "No transactions in this period"
      : `${rows[0].date} – ${rows.at(-1)!.date}`;

  return {
    month,
    type_filter,
    period_label,
    opening_sen,
    debit_sen: micro_to_sen_display(debit_micro),
    credit_sen: micro_to_sen_display(credit_micro),
    closing_sen,
    rows,
  };
}