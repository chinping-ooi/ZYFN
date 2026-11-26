"use client";

import Link from "next/link";
import type { AccountRoutePrefix } from "@/lib/accounts/types";
import { MBB_2_GOLD_SLUG } from "@/lib/credit_cards/mbb_2_gold_combined";

const TAB_CLASS =
  "inline-flex items-center rounded-[3px] border px-3 py-1 text-[13px] font-medium transition-colors";
const TAB_ACTIVE =
  "border-zyfn-navy bg-zyfn-navy text-white";
const TAB_IDLE =
  "border-zyfn-line bg-white text-zyfn-ink hover:bg-[#f4f6f8]";

export function AccountViewTabs({
  route_prefix,
  account_slug,
  active,
}: {
  route_prefix: AccountRoutePrefix;
  account_slug: string;
  active: "statement" | "summary";
}) {
  const base = `/${route_prefix}/${account_slug}`;
  const is_mbb_2_gold_combined = account_slug === MBB_2_GOLD_SLUG;
  const mbb_2_gold_member =
    route_prefix === "credit-cards" &&
    (account_slug === "mbb-visa-1697" || account_slug === "mbb-amex-8060");
  return (
    <nav
      className="mt-2 flex flex-wrap gap-2"
      aria-label="Account views"
    >
      {is_mbb_2_gold_combined ? null : (
        <Link
          href={base}
          className={`${TAB_CLASS} ${active === "statement" ? TAB_ACTIVE : TAB_IDLE}`}
          aria-current={active === "statement" ? "page" : undefined}
        >
          Account statement
        </Link>
      )}
      <Link
        href={`${base}/summary`}
        className={`${TAB_CLASS} ${active === "summary" ? TAB_ACTIVE : TAB_IDLE}`}
        aria-current={active === "summary" ? "page" : undefined}
      >
        Summary
      </Link>
      {mbb_2_gold_member ? (
        <Link
          href={`/credit-cards/${MBB_2_GOLD_SLUG}/summary`}
          className={`${TAB_CLASS} ${TAB_IDLE}`}
        >
          MBB 2 Gold
        </Link>
      ) : null}
    </nav>
  );
}