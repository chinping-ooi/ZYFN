import type { TngDirection } from "@/lib/tng/import/types";

/**
 * Classify cash-flow for dashboard totals (transfers excluded from income/spense).
 * No personal-name rules — type/description keywords only.
 */
export function classify_tng_direction(
  raw_type: string,
  description: string,
): TngDirection {
  const type = raw_type.toLowerCase().trim();
  const desc = description.toLowerCase();

  if (
    type.includes("go+ cash in") ||
    type.includes("go+ cash out") ||
    type.includes("ewallet cash out") ||
    desc.includes("quick reload payment") ||
    type === "fpx" ||
    type.includes("fpx transfer")
  ) {
    return "transfer";
  }

  if (
    type.includes("reload") ||
    type.includes("receive") ||
    type.includes("refund") ||
    type.includes("go+ daily") ||
    type.includes("balance top up") ||
    type.includes("payment cancelled") ||
    desc.includes("payment cancelled")
  ) {
    return "in";
  }

  if (
    type.includes("payment") ||
    type.includes("duitnow") ||
    type.includes("rfid") ||
    type.includes("card") ||
    type.includes("paydirect") ||
    type.includes("transfer to wallet")
  ) {
    return "out";
  }

  return "out";
}