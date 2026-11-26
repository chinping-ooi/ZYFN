"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  WALLET_HREF,
  wallet_filter_options,
} from "@/lib/wallets/routes";
import { account_statement_href } from "@/lib/accounts/view_paths";

const SEGMENT =
  "inline-flex max-w-full shrink-0 flex-wrap rounded-[3px] border border-zyfn-line bg-white p-0.5";
const BTN =
  "inline-flex h-8 items-center rounded-[2px] px-2.5 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60";
const BTN_ACTIVE = "bg-zyfn-navy text-white";
const BTN_IDLE = "text-zyfn-ink hover:bg-[#f4f6f8]";

function wallet_view_base(pathname: string): string {
  if (pathname.endsWith("/statement")) {
    return account_statement_href(WALLET_HREF);
  }
  return WALLET_HREF;
}

export function WalletAccountToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active_wallet = searchParams.get("wallet")?.trim() || null;
  const view_base = wallet_view_base(pathname);
  const options = wallet_filter_options();

  const other_query = new URLSearchParams(searchParams.toString());
  other_query.delete("wallet");

  return (
    <div className={SEGMENT} role="group" aria-label="Filter by wallet account">
      {options.map((option) => {
        const params = new URLSearchParams(other_query.toString());
        if (option.slug) params.set("wallet", option.slug);
        const query = params.toString();
        const href = query ? `${view_base}?${query}` : view_base;
        const active =
          option.slug === null ? !active_wallet : active_wallet === option.slug;
        return (
          <Link
            key={option.slug ?? "overview"}
            href={href}
            className={`${BTN} ${active ? BTN_ACTIVE : BTN_IDLE}`}
            aria-current={active ? "page" : undefined}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}