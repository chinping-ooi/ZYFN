import type { AccountViewMode } from "@/lib/accounts/account_view_preference";
import { account_statement_href } from "@/lib/accounts/view_paths";

export function is_account_hub_nav_href(href: string): boolean {
  const path = href.replace(/\/$/, "");
  return (
    path.startsWith("/transactions/") || path.startsWith("/credit-cards/")
  );
}

/** Sidebar account link target respecting global summary vs statement preference. */
export function resolve_sidebar_account_href(
  href: string,
  view: AccountViewMode,
  month_query: string | null,
): string {
  const query = month_query?.trim() ? month_query.trim() : "";
  const suffix = query.startsWith("?") ? query : query ? `?${query}` : "";

  const normalized = href.replace(/\/$/, "");

  if (!is_account_hub_nav_href(href)) {
    return `${normalized}${suffix}`;
  }

  const path = view === "statement" ? account_statement_href(normalized) : normalized;
  return `${path}${suffix}`;
}