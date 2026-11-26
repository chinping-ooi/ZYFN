"use client";

import Link from "next/link";
import { mbb_2_gold_combined_href } from "@/lib/credit_cards/mbb_2_gold_routes";

const TAB_CLASS =
  "inline-flex items-center rounded-[3px] border px-3 py-1 text-[13px] font-medium transition-colors";
const TAB_ACTIVE =
  "border-zyfn-navy bg-zyfn-navy text-white";
const TAB_IDLE =
  "border-zyfn-line bg-white text-zyfn-ink hover:bg-[#f4f6f8]";

export function AccountViewTabs({
  view_base_path,
  active,
  show_mbb_2_gold_link = false,
}: {
  view_base_path: string;
  active: "statement" | "summary";
  show_mbb_2_gold_link?: boolean;
}) {
  return (
    <nav
      className="mt-2 flex flex-wrap gap-2"
      aria-label="Account views"
    >
      <Link
        href={view_base_path}
        className={`${TAB_CLASS} ${active === "statement" ? TAB_ACTIVE : TAB_IDLE}`}
        aria-current={active === "statement" ? "page" : undefined}
      >
        Account statement
      </Link>
      <Link
        href={`${view_base_path}/summary`}
        className={`${TAB_CLASS} ${active === "summary" ? TAB_ACTIVE : TAB_IDLE}`}
        aria-current={active === "summary" ? "page" : undefined}
      >
        Summary
      </Link>
      {show_mbb_2_gold_link ? (
        <Link
          href={mbb_2_gold_combined_href()}
          className={`${TAB_CLASS} ${TAB_IDLE}`}
        >
          MBB 2 Gold
        </Link>
      ) : null}
    </nav>
  );
}