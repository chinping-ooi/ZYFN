import { ACCOUNTS } from "@/lib/accounts/registry";
import type { AccountRegistryEntry } from "@/lib/accounts/types";
import {
  MBB_2_GOLD_SLUG,
  MBB_2_GOLD_LABEL,
} from "@/lib/credit_cards/mbb_2_gold_combined";

export type Mbb2GoldCardSegment = "1697" | "8060";

export const MBB_2_GOLD_CARD_SEGMENTS: Mbb2GoldCardSegment[] = ["1697", "8060"];

const CARD_TO_ACCOUNT_REF: Record<Mbb2GoldCardSegment, string> = {
  "1697": "MBB_VISA_1697",
  "8060": "MBB_AMEX_8060",
};

const LEGACY_SLUG_TO_SEGMENT: Record<string, Mbb2GoldCardSegment> = {
  "mbb-visa-1697": "1697",
  "mbb-amex-8060": "8060",
};

export const MBB_2_GOLD_LEGACY_SLUGS = new Set(Object.keys(LEGACY_SLUG_TO_SEGMENT));

export function mbb_2_gold_combined_href(): string {
  return `/credit-cards/${MBB_2_GOLD_SLUG}`;
}

export function mbb_2_gold_card_href(segment: Mbb2GoldCardSegment): string {
  return `${mbb_2_gold_combined_href()}/${segment}`;
}

export function mbb_2_gold_card_summary_href(segment: Mbb2GoldCardSegment): string {
  return `${mbb_2_gold_card_href(segment)}/summary`;
}

export function mbb_2_gold_legacy_statement_redirect(
  legacy_slug: string,
): string | undefined {
  const segment = LEGACY_SLUG_TO_SEGMENT[legacy_slug];
  if (!segment) return undefined;
  return mbb_2_gold_card_href(segment);
}

export function mbb_2_gold_legacy_summary_redirect(
  legacy_slug: string,
): string | undefined {
  const segment = LEGACY_SLUG_TO_SEGMENT[legacy_slug];
  if (!segment) return undefined;
  return mbb_2_gold_card_summary_href(segment);
}

export function append_month_query(
  path: string,
  searchParams: Record<string, string | string[] | undefined> | undefined,
): string {
  const month = searchParams?.month;
  if (typeof month !== "string" || month.length === 0) return path;
  return `${path}?month=${encodeURIComponent(month)}`;
}

export function is_mbb_2_gold_card_segment(
  value: string,
): value is Mbb2GoldCardSegment {
  return value === "1697" || value === "8060";
}

export function mbb_2_gold_registry_entry_for_card(
  card: Mbb2GoldCardSegment,
): AccountRegistryEntry | undefined {
  const account_ref = CARD_TO_ACCOUNT_REF[card];
  return ACCOUNTS.find((entry) => entry.account_ref === account_ref);
}

export function mbb_2_gold_card_nav_label(segment: Mbb2GoldCardSegment): string {
  return segment === "1697" ? "Visa 1697" : "Amex 8060";
}

export { MBB_2_GOLD_SLUG, MBB_2_GOLD_LABEL };