/** Parse a decimal major-unit string into integer sen without float drift. */

const MONEY_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

export function major_text_to_sen(text: string): number {
  const normalized = text.replace(/,/g, "").trim();
  if (!MONEY_PATTERN.test(normalized)) {
    throw new Error(`Invalid monetary amount: ${text}`);
  }
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, frac = ""] = unsigned.split(".");
  const frac_padded = (frac + "00").slice(0, 2);
  const sen = BigInt(whole) * BigInt(100) + BigInt(frac_padded);
  const value = Number(sen);
  return negative ? -value : value;
}

export function parse_optional_money(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const text =
    typeof value === "number"
      ? format_number_major(value)
      : String(value).trim();
  if (!text) return null;
  return major_text_to_sen(text);
}

export function parse_required_money(value: unknown, field: string): number {
  const parsed = parse_optional_money(value);
  if (parsed === null) throw new Error(`${field} is required`);
  return parsed;
}

function format_number_major(value: number): string {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid monetary amount");
  }
  return value.toFixed(2);
}