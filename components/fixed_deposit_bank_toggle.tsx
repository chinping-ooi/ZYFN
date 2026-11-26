"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  bank_code_to_label,
  bank_code_to_slug,
  DEFAULT_FD_BANK_CODES,
  ordered_bank_codes,
} from "@/lib/fixed_deposits/banks";

const SEGMENT =
  "inline-flex max-w-full shrink-0 flex-wrap rounded-[3px] border border-zyfn-line bg-white p-0.5";
const BTN =
  "inline-flex h-8 items-center rounded-[2px] px-2.5 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60";
const BTN_ACTIVE = "bg-zyfn-navy text-white";
const BTN_IDLE = "text-zyfn-ink hover:bg-[#f4f6f8]";

export function FixedDepositBankToggle({
  bank_codes = DEFAULT_FD_BANK_CODES,
}: {
  bank_codes?: string[];
}) {
  const searchParams = useSearchParams();
  const active_slug = searchParams.get("bank")?.trim() || null;

  const other_query = new URLSearchParams(searchParams.toString());
  other_query.delete("bank");

  const options = [
    { slug: null as string | null, label: "Overview" },
    ...ordered_bank_codes(bank_codes).map((code) => ({
      slug: bank_code_to_slug(code),
      label: bank_code_to_label(code),
    })),
  ];

  function href_for_slug(slug: string | null): string {
    const params = new URLSearchParams(other_query.toString());
    if (slug) params.set("bank", slug);
    const query = params.toString();
    return query ? `/fixed-deposits?${query}` : "/fixed-deposits";
  }

  return (
    <div className={SEGMENT} role="group" aria-label="Filter by bank">
      {options.map((option) => {
        const href = href_for_slug(option.slug);
        const active =
          option.slug === null ? !active_slug : active_slug === option.slug;
        return (
          <Link
            key={option.slug ?? "all"}
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