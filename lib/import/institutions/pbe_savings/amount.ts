import { decimal_myr_to_sen } from "@/lib/supabase/decimal_to_sen";

export function parse_amount_cell(raw: unknown): string {
  if (raw === null || raw === undefined || raw === "") return "0.00";
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw.toFixed(2);
  }
  const text = String(raw).replace(/,/g, "").replace(/RM\s*/gi, "").trim();
  if (!text || text === "-") return "0.00";
  const negative = text.startsWith("(") && text.endsWith(")");
  const unsigned = negative ? text.slice(1, -1) : text;
  const n = Number.parseFloat(unsigned);
  if (!Number.isFinite(n)) return "0.00";
  const major = (negative ? -n : n).toFixed(2);
  return major;
}

export function row_money_from_direction(
  direction: "in" | "out",
  amount_major: string,
  balance_major: string,
): { in_sen: number; out_sen: number; balance_sen: number } {
  const amount_sen = Math.abs(decimal_myr_to_sen(amount_major));
  return {
    in_sen: direction === "in" ? amount_sen : 0,
    out_sen: direction === "out" ? amount_sen : 0,
    balance_sen: decimal_myr_to_sen(balance_major),
  };
}