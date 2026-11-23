export type ColumnType =
  | "text"
  | "money"
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
};

export type SortDirection = "ascending" | "descending";