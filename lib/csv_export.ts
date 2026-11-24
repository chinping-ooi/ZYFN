import type { DataTableColumn } from "@/components/data_table/types";
import { minor_to_major, type MinorAmount } from "@/lib/money";

function quote(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function sanitize_formula_injection(value: string): string {
  if (/^\s*[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function cell_export_value(
  raw: unknown,
  column: DataTableColumn<Record<string, unknown>>,
): string {
  if (raw === null || raw === undefined) return "";
  switch (column.type) {
    case "money": {
      const minor = raw as MinorAmount;
      if (column.zero_as_blank && minor === 0) return "";
      return minor_to_major(minor).toFixed(2);
    }
    case "date":
      return String(raw);
    case "rate":
      return `${Number(raw).toFixed(2)}%`;
    case "months":
      return `${raw} months`;
    case "status":
      return String(raw);
    default:
      return sanitize_formula_injection(String(raw));
  }
}

export function build_csv<T extends Record<string, unknown>>(
  columns: DataTableColumn<T>[],
  rows: T[],
  display: (row: T, column: DataTableColumn<T>) => string,
): string {
  const lines: string[] = [
    columns.map((col) => quote(col.label)).join(","),
  ];
  for (const row of rows) {
    lines.push(
      columns
        .map((col) => {
          const raw = row[col.key as keyof T];
          let value: string;
          if (col.type === "date") {
            value = raw ? String(raw) : "";
          } else if (col.type === "money") {
            value = cell_export_value(raw, col as DataTableColumn<Record<string, unknown>>);
          } else {
            value = display(row, col);
            if (typeof raw === "string") {
              value = sanitize_formula_injection(value);
            }
          }
          return quote(value);
        })
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\r\n")}`;
}

export function download_csv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function export_date_range(
  period: "week" | "month" | "year" | "custom",
  anchor_iso: string,
  custom_start?: string,
  custom_end?: string,
): [string, string] {
  switch (period) {
    case "week": {
      const monday = new Date(anchor_iso + "T00:00:00Z");
      monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
      const sunday = new Date(monday);
      sunday.setUTCDate(sunday.getUTCDate() + 6);
      return [monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10)];
    }
    case "month": {
      const month = anchor_iso.slice(0, 7);
      const end = new Date(month + "-01T00:00:00Z");
      end.setUTCMonth(end.getUTCMonth() + 1, 0);
      return [month + "-01", end.toISOString().slice(0, 10)];
    }
    case "year": {
      const year = anchor_iso.slice(0, 4);
      return [`${year}-01-01`, `${year}-12-31`];
    }
    default:
      return [custom_start ?? "", custom_end ?? ""];
  }
}