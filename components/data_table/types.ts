export type ColumnType =
  | "text"
  | "money"
  | "money_micro"
  | "date"
  | "rate"
  | "months"
  | "status";

export type DataTableColumn<T> = {
  key: keyof T & string;
  label: string;
  type?: ColumnType;
  zero_as_blank?: boolean;
  className?: string;
  sortable?: boolean;
  /** For money_micro: row key holding wallet | go_plus */
  account_key?: keyof T & string;
};

export type SortDirection = "ascending" | "descending";