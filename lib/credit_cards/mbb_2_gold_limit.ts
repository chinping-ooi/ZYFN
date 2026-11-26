import { major_to_minor } from "@/lib/money";
import type { MinorAmount } from "@/lib/money";

/**
 * Shared Maybank 2 Gold credit limit (sen). Not stored in this repo's schema;
 * set in `.env.local` when known:
 *
 * - `NEXT_PUBLIC_MBB_2_GOLD_CREDIT_LIMIT_SEN` — integer sen, or
 * - `NEXT_PUBLIC_MBB_2_GOLD_CREDIT_LIMIT_MAJOR` — RM major units (e.g. 50000).
 *
 * When unset, the UI shows “Limit not set”.
 */
export function mbb_2_gold_shared_limit_sen(): MinorAmount | null {
  const sen_raw = process.env.NEXT_PUBLIC_MBB_2_GOLD_CREDIT_LIMIT_SEN;
  if (sen_raw !== undefined && sen_raw !== "") {
    const parsed = Number.parseInt(sen_raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const major_raw = process.env.NEXT_PUBLIC_MBB_2_GOLD_CREDIT_LIMIT_MAJOR;
  if (major_raw !== undefined && major_raw !== "") {
    const major = Number.parseFloat(major_raw);
    if (Number.isFinite(major) && major > 0) {
      return major_to_minor(major);
    }
  }

  return null;
}