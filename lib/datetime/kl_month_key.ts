/** Calendar month for txn_at in Asia/Kuala_Lumpur (matches statement month filter). */
const KL = "Asia/Kuala_Lumpur";

export function kl_month_key(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  return `${year}-${month}`;
}