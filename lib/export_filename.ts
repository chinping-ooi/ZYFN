function account_label_slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

export function build_export_filename(
  account_label: string,
  start: string,
  end: string,
): string {
  const slug = account_label_slug(
    account_label.replace(/\s+activity$/i, "").trim(),
  );
  return `zyfn_${slug || "export"}_${start}_to_${end}.xlsx`;
}

/** Import review preview — all parsed rows, no statement date range in the name. */
export function build_import_preview_export_filename(
  account_label: string,
  exported_on: Date = new Date(),
): string {
  const slug = account_label_slug(account_label.trim());
  const yyyymmdd = exported_on.toISOString().slice(0, 10).replace(/-/g, "");
  return `import_preview_${slug || "account"}_${yyyymmdd}.xlsx`;
}