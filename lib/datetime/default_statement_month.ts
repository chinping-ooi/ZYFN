const KL = "Asia/Kuala_Lumpur";

/** Previous calendar month in Asia/Kuala_Lumpur (default statement/summary filter). */
export function default_statement_month_key(as_of: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KL,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(as_of);

  let year = Number(parts.find((p) => p.type === "year")?.value ?? "0");
  let month = Number(parts.find((p) => p.type === "month")?.value ?? "0");
  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

const MONTH_KEY_RE = /^\d{4}-\d{2}$/;

export function is_statement_month_key(value: string): boolean {
  return MONTH_KEY_RE.test(value);
}

export function statement_month_key_label(month_key: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: KL,
  }).format(new Date(`${month_key}-01T12:00:00+08:00`));
}

export function resolve_statement_month_from_query(
  query_month: string | null,
): string | "all" {
  if (query_month === "all") return "all";
  if (query_month && is_statement_month_key(query_month)) return query_month;
  return default_statement_month_key();
}

export function ensure_month_in_options(
  options: { value: string; label: string }[],
  month: string | "all",
): { value: string; label: string }[] {
  if (month === "all" || options.some((o) => o.value === month)) {
    return options;
  }
  const with_extra = [
    ...options,
    { value: month, label: statement_month_key_label(month) },
  ];
  return with_extra.sort((a, b) => {
    if (a.value === "all") return -1;
    if (b.value === "all") return 1;
    return b.value.localeCompare(a.value);
  });
}