import type { LedgerTransaction, ParsedSheet } from "@/lib/workbook/types";
import type { MinorAmount } from "@/lib/money";

export type StatementSlice = {
  month: string | "all";
  period_label: string;
  opening_sen: MinorAmount | null;
  debit_sen: MinorAmount;
  credit_sen: MinorAmount;
  closing_sen: MinorAmount | null;
  rows: LedgerTransaction[];
};

function month_options_from_sheet(sheet: ParsedSheet) {
  const keys = [
    ...new Set(sheet.transactions.map((row) => row.date.slice(0, 7))),
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

export function statement_month_options(sheet: ParsedSheet) {
  return month_options_from_sheet(sheet);
}

export function build_statement(
  sheet: ParsedSheet,
  month: string | "all",
): StatementSlice {
  const rows =
    month === "all"
      ? sheet.transactions
      : sheet.transactions.filter((row) => row.date.startsWith(month));

  const debit_sen = rows.reduce((t, row) => t + row.debit_sen, 0);
  const credit_sen = rows.reduce((t, row) => t + row.credit_sen, 0);

  let opening_sen: MinorAmount | null = null;
  let closing_sen: MinorAmount | null = null;

  if (rows.length === 0) {
    opening_sen = sheet.opening_balance_sen;
    closing_sen = sheet.opening_balance_sen;
  } else {
    const first = rows[0];
    opening_sen =
      first.balance_sen + first.debit_sen - first.credit_sen;
    closing_sen = rows.at(-1)!.balance_sen;
  }

  const period_label =
    rows.length === 0
      ? "No transactions in this period"
      : `${rows[0].date} – ${rows.at(-1)!.date}`;

  return {
    month,
    period_label,
    opening_sen,
    debit_sen,
    credit_sen,
    closing_sen,
    rows,
  };
}