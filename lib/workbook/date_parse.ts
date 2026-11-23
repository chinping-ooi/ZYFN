const KL_TZ = "Asia/Kuala_Lumpur";

/** Calendar date in Kuala Lumpur as YYYY-MM-DD (no off-by-one). */
export function format_kl_iso(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const DMY_PATTERN =
  /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/;

function expand_two_digit_year(year: number): number {
  if (year >= 100) return year;
  return year < 50 ? 2000 + year : 1900 + year;
}

/** Excel 1900 date system (epoch 1899-12-30). */
export function excel_serial_to_iso(serial: number): string {
  const epochUtc = Date.UTC(1899, 11, 30);
  const whole = Math.floor(serial);
  const ms = epochUtc + whole * 86_400_000;
  return format_kl_iso(new Date(ms));
}

export function parse_date_cell(value: unknown): string {
  if (value instanceof Date) {
    return format_kl_iso(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return excel_serial_to_iso(value);
  }
  const text = String(value ?? "").trim();
  if (!text) throw new Error("Date is missing");
  const match = DMY_PATTERN.exec(text);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = expand_two_digit_year(Number(match[3]));
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Invalid date: ${text}`);
    }
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  throw new Error(`Unrecognised date: ${text}`);
}