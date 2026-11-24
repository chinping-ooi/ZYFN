import type { DataTableColumn } from "@/components/data_table/types";

export function column_header_class<T>(
  column: DataTableColumn<T>,
): string {
  const parts: string[] = [];
  if (column.headerClassName) parts.push(column.headerClassName);

  if (column.type === "date" || column.key === "date") {
    parts.push("w-[6.75rem] max-w-[6.75rem]");
  } else if (column.type === "money" || column.type === "money_micro") {
    parts.push("w-[6.25rem] max-w-[6.25rem]");
  } else if (column.key === "description") {
    parts.push("w-[38%] min-w-[11rem]");
  } else if (column.key === "status") {
    parts.push("w-[5.5rem] max-w-[5.5rem]");
  } else if (column.key === "type") {
    parts.push("w-[8.5rem] max-w-[8.5rem]");
  } else if (column.key === "reference") {
    parts.push("w-[6.5rem] max-w-[6.5rem]");
  } else if (column.key === "account") {
    parts.push("w-[4.5rem] max-w-[4.5rem]");
  }

  return parts.join(" ");
}

export function column_cell_class<T>(
  column: DataTableColumn<T>,
): string {
  const parts: string[] = [];
  if (column.className) parts.push(column.className);

  if (column.type === "date" || column.key === "date") {
    parts.push("whitespace-nowrap");
  } else if (column.type === "money" || column.type === "money_micro") {
    parts.push("whitespace-nowrap tabular-nums");
  } else if (column.key === "description") {
    parts.push("min-w-[11rem] whitespace-normal break-words line-clamp-3 text-left");
  } else if (column.type === "status") {
    parts.push("whitespace-nowrap");
  } else {
    parts.push("truncate");
  }

  return parts.join(" ");
}