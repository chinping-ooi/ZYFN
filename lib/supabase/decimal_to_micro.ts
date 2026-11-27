import {
  major_text_to_micro,
  type MicroAmount,
} from "@/lib/tng/money_micro";

/** Convert a Postgres numeric string (MYR) to integer micro-units (4 dp). */
export function decimal_myr_to_micro(value: string | number): MicroAmount {
  return major_text_to_micro(String(value).trim(), 4);
}