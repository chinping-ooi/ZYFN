/** TNG dump dates (DD/MM/YYYY lines) — split from legacy workbook parser. */
export function parse_tng_dump_date(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) throw new Error("Date is missing");
  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(text);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    let year = Number(match[3]);
    if (year < 100) year = year < 50 ? 2000 + year : 1900 + year;
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Invalid date: ${text}`);
    }
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  throw new Error(`Unrecognised date: ${text}`);
}