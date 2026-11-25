import type { DataTableColumn } from "@/components/data_table/types";
import { format_money, type MinorAmount } from "@/lib/money";
import {
  display_dp_for_account,
  format_micro_money,
  type MicroAmount,
} from "@/lib/tng/money_micro";

export function display_cell<T extends Record<string, unknown>>(
  row: T,
  column: DataTableColumn<T>,
): string {
  const value = row[column.key];
  if (value === null || value === undefined) return "";
  if (typeof value === "string" && value.trim() === "") return "";
  switch (column.type) {
    case "money": {
      if (value === null) return "";
      const minor = value as MinorAmount;
      if (column.zero_as_blank && minor === 0) return "";
      return format_money(minor);
    }
    case "money_micro": {
      if (value === null) return "";
      const micro = value as MicroAmount;
      if (column.zero_as_blank && micro === 0) return "";
      const account_key = column.account_key ?? "account";
      const account = String(row[account_key] ?? "wallet");
      const dp = display_dp_for_account(
        account === "go_plus" ? "go_plus" : "wallet",
      );
      return format_micro_money(micro, dp);
    }
    case "date": {
      const raw = String(value);
      const instant = raw.includes("T")
        ? new Date(raw)
        : new Date(`${raw}T00:00:00Z`);
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: column.time_zone ?? "UTC",
      }).format(instant);
    }
    case "rate":
      return `${(Number(value) / 100).toFixed(2)}%`;
    case "months":
      return `${value} months`;
    case "status":
      return String(value);
    default:
      if (column.key === "account") {
        if (value === "go_plus") return "GO+";
        if (value === "wallet") return "Wallet";
      }
      return String(value);
  }
}

export function compare_rows<T extends Record<string, unknown>>(
  left: T,
  right: T,
  column: DataTableColumn<T>,
  direction: 1 | -1,
): number {
  const a = left[column.key];
  const b = right[column.key];
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * direction;
  }
  return String(a).localeCompare(String(b), "en", {
    numeric: true,
    sensitivity: "base",
  }) * direction;
}