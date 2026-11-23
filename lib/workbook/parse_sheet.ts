import * as XLSX from "xlsx";
import { parse_date_cell } from "@/lib/workbook/date_parse";
import {
  major_text_to_sen,
  parse_optional_money,
  parse_required_money,
} from "@/lib/workbook/money_parse";
import type {
  AccountId,
  LedgerTransaction,
  ParsedSheet,
  SkippedRow,
} from "@/lib/workbook/types";

const HEADER_ALIASES: Record<string, "date" | "description" | "debit" | "credit" | "balance"> = {
  date: "date",
  "transaction date": "date",
  description: "description",
  "transaction description": "description",
  debit: "debit",
  "debit amount": "debit",
  credit: "credit",
  "credit amount": "credit",
  balance: "balance",
};

type ColumnMap = Record<"date" | "description" | "debit" | "credit" | "balance", string>;

function map_headers(row: Record<string, unknown>): ColumnMap | null {
  const keys: Partial<ColumnMap> = {};
  for (const key of Object.keys(row)) {
    const alias = HEADER_ALIASES[key.trim().toLowerCase()];
    if (alias) keys[alias] = key;
  }
  const required = ["date", "description", "debit", "credit", "balance"] as const;
  if (!required.every((name) => keys[name])) return null;
  return keys as ColumnMap;
}

function is_opening_balance(description: string): boolean {
  return /^opening\s+balance/i.test(description.trim());
}

function cell_major_text(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") return value.replace(/,/g, "").trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }
  return String(value).trim() || null;
}

export function parse_account_sheet(
  workbook: XLSX.WorkBook,
  sheet_name: string,
  account_id: AccountId,
  account_label: string,
): ParsedSheet {
  const sheet = workbook.Sheets[sheet_name];
  if (!sheet) {
    throw new Error(`Sheet “${sheet_name}” was not found in Transaction.xlsx.`);
  }

  const raw_rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: true,
  });
  const display_rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  });

  if (raw_rows.length === 0) {
    throw new Error(`Sheet “${sheet_name}” has no rows.`);
  }

  const columns = map_headers(raw_rows[0]);
  if (!columns) {
    throw new Error(
      `Sheet “${sheet_name}” must include Date, Description, Debit, Credit, and Balance headers.`,
    );
  }

  let opening_balance_sen = 0;
  const transactions: LedgerTransaction[] = [];
  const skipped_rows: SkippedRow[] = [];
  let reconcile_warning_count = 0;
  let running_balance_sen: number | null = null;

  for (let index = 1; index < raw_rows.length; index++) {
    const row_number = index + 1;
    const raw = raw_rows[index];
    const display = display_rows[index] ?? raw;

    try {
      const description = String(raw[columns.description] ?? "").trim();
      const date = parse_date_cell(raw[columns.date]);
      const balance_text = cell_major_text(display[columns.balance]);
      const balance_sen =
        balance_text !== null
          ? major_text_to_sen(balance_text)
          : parse_required_money(display[columns.balance], "Balance");

      const debit_sen = parse_optional_money(display[columns.debit]) ?? 0;
      const credit_sen = parse_optional_money(display[columns.credit]) ?? 0;

      if (is_opening_balance(description)) {
        opening_balance_sen = balance_sen;
        running_balance_sen = balance_sen;
        continue;
      }

      if (debit_sen < 0 || credit_sen < 0) {
        throw new Error("Debit and credit must be zero or positive");
      }
      if (debit_sen > 0 && credit_sen > 0) {
        throw new Error("Row has both debit and credit");
      }

      let reconcile_ok = true;
      if (running_balance_sen !== null) {
        const expected: number =
          running_balance_sen - debit_sen + credit_sen;
        if (expected !== balance_sen) {
          reconcile_ok = false;
          reconcile_warning_count += 1;
        }
      }
      running_balance_sen = balance_sen;

      transactions.push({
        date,
        description,
        debit_sen,
        credit_sen,
        balance_sen,
        reconcile_ok,
      });
    } catch (error) {
      skipped_rows.push({
        row_number,
        reason: error instanceof Error ? error.message : "Invalid row",
      });
    }
  }

  const closing_balance_sen =
    transactions.length > 0
      ? transactions[transactions.length - 1].balance_sen
      : opening_balance_sen;

  return {
    account_id,
    account_label,
    sheet_name,
    source: "Transaction.xlsx",
    opening_balance_sen,
    closing_balance_sen,
    transactions,
    skipped_rows,
    reconcile_warning_count,
  };
}