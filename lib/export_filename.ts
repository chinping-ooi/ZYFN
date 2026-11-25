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