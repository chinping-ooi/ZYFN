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
  /** Description column: single-line truncate instead of line-clamp wrap */
  single_line?: boolean;
};

export type SortDirection = "ascending" | "descending";