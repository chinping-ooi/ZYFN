import type { ReactNode } from "react";

export type ColumnType =
  | "text"
  | "money"
  | "money_micro"
  | "date"
  | "rate"
  | "percent"
  | "months"
  | "status";

export type DataTableColumn<T> = {
  key: keyof T & string;
  label: string;
  type?: ColumnType;
  /** IANA zone for `date` columns (default UTC). */
  time_zone?: string;
  zero_as_blank?: boolean;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  /** For money_micro: row key holding wallet | go_plus */
  account_key?: keyof T & string;
  /** When true, render even if `label` is empty (e.g. icon-only actions). */
  allow_blank_header?: boolean;
  /** Optional custom cell body (export still uses display_cell). */
  render_cell?: (row: T) => ReactNode;
};

export type SortDirection = "ascending" | "descending";