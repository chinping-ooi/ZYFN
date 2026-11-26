import type { DataTableColumn } from "@/components/data_table/types";

export function column_header_label(column: DataTableColumn<unknown>): string {
  const raw = column.label;
  if (typeof raw === "string") return raw;
  if (raw == null) return "";
  return String(raw);
}

/** Columns shown in the ledger grid — skip blank headers unless explicitly allowed (e.g. actions). */
export function is_visible_table_column(
  column: DataTableColumn<unknown>,
): boolean {
  if (column.allow_blank_header) return true;
  return column_header_label(column).trim().length > 0;
}

export function visible_table_columns<T>(
  columns: DataTableColumn<T>[] | null | undefined,
): DataTableColumn<T>[] {
  if (!columns?.length) return [];
  return columns.filter((col) =>
    is_visible_table_column(col as DataTableColumn<unknown>),
  );
}