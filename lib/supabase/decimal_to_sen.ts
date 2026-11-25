import type { MinorAmount } from "@/lib/money";

/** Convert a Postgres numeric string (MYR major units) to integer sen without float drift. */
export function decimal_myr_to_sen(value: string | number): MinorAmount {
  const raw = String(value).trim();
  if (!raw) return 0;
  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const [whole_part = "0", frac_part = ""] = unsigned.split(".");
  const whole = Number.parseInt(whole_part, 10);
  const frac = Number.parseInt((frac_part + "00").slice(0, 2), 10);
  const sen = whole * 100 + frac;
  return negative ? -sen : sen;
}