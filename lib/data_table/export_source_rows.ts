/** Rows passed to ExportDialog — either search/sort filtered or the full loaded set. */
export function resolve_table_export_rows<T>(options: {
  export_all_rows?: boolean;
  export_rows?: T[];
  safe_rows: T[];
  filtered: T[];
}): T[] {
  if (options.export_all_rows) {
    return options.export_rows ?? options.safe_rows;
  }
  return options.filtered;
}