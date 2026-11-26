import { ACCOUNTS } from "@/lib/accounts/registry";
import {
  account_statement_href,
  append_search_query,
} from "@/lib/accounts/view_paths";

export const WALLET_HREF = "/transactions/touch-n-go";

const WALLET_CHILD_SLUGS = ["tng-ewallet", "tng-go-plus"] as const;

export type WalletFilterSlug = (typeof WALLET_CHILD_SLUGS)[number];

export function wallet_filter_options(): { slug: string | null; label: string }[] {
  const children = WALLET_CHILD_SLUGS.map((slug) => {
    const entry = ACCOUNTS.find((a) => a.slug === slug);
    return {
      slug,
      label: entry?.account_label ?? slug,
    };
  });
  return [{ slug: null, label: "Overview" }, ...children];
}

export function is_wallet_child_slug(
  value: string,
): value is WalletFilterSlug {
  return (WALLET_CHILD_SLUGS as readonly string[]).includes(value);
}

export function wallet_legacy_redirect_href(
  legacy_slug: string,
  searchParams: Record<string, string | string[] | undefined> | undefined,
  view: "summary" | "statement",
): string {
  const base =
    view === "statement"
      ? account_statement_href(WALLET_HREF)
      : WALLET_HREF;
  return append_search_query(base, {
    ...searchParams,
    wallet: legacy_slug,
  });
}