import type { DataTableColumn } from "@/components/data_table/types";
import { format_money, type MinorAmount } from "@/lib/money";
import { status_label, type FdStatus } from "@/lib/fd_status";

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
    case "date":
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(String(value) + (String(value).includes("T") ? "" : "T00:00:00Z")));
    case "rate":
      return `${(Number(value) / 100).toFixed(2)}%`;
    case "months":
      return `${value} months`;
    case "status":
      return status_label(value as FdStatus);
    default:
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