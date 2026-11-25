/**
 * TNG ledger amounts in micro-units: 1 micro = RM 0.0001 (10_000 micro = RM 1).
 * Wallet rows use multiples of 100 micro (= 1 sen). GO+ may use full 4 dp.
 */

export type MicroAmount = number;

const MICRO_PER_SEN = 100;
export const MICRO_PER_RM = 10_000;

const MAJOR_PATTERN = /^-?\d+(?:\.\d{1,4})?$/;

export function major_text_to_micro(
  text: string,
  max_decimals: 2 | 4 = 4,
): MicroAmount {
  const normalized = text.replace(/,/g, "").trim();
  if (!MAJOR_PATTERN.test(normalized)) {
    throw new Error(`Invalid monetary amount: ${text}`);
  }
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [whole, frac = ""] = unsigned.split(".");
  if (frac.length > max_decimals) {
    throw new Error(`Invalid monetary amount: ${text}`);
  }
  const frac_padded = (frac + "0000").slice(0, 4);
  const micro =
    BigInt(whole) * BigInt(MICRO_PER_RM) + BigInt(frac_padded);
  const value = Number(micro);
  return negative ? -value : value;
}

export function format_micro_money(micro: MicroAmount, max_dp: 2 | 4): string {
  const negative = micro < 0;
  const abs = Math.abs(micro);
  const whole = Math.floor(abs / MICRO_PER_RM);
  const frac4 = String(abs % MICRO_PER_RM).padStart(4, "0");
  if (max_dp === 2) {
    const frac = frac4.slice(0, 2);
    return `${negative ? "-" : ""}${whole}.${frac}`;
  }
  let frac = frac4.replace(/0+$/, "");
  if (frac.length === 0) frac = "00";
  else if (frac.length === 1) frac = `${frac}0`;
  return `${negative ? "-" : ""}${whole}.${frac}`;
}

export function micro_to_sen_display(micro: MicroAmount): number {
  return Math.round(micro / MICRO_PER_SEN);
}

export function display_dp_for_account(
  account: "wallet" | "go_plus",
): 2 | 4 {
  return account === "go_plus" ? 4 : 2;
}