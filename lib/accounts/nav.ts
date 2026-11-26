import {
  bank_code_to_label,
  bank_code_to_slug,
  ordered_bank_codes,
} from "@/lib/fixed_deposits/banks";
import { ACCOUNTS, account_path } from "@/lib/accounts/registry";
import type { NavGroupKey } from "@/lib/accounts/types";
import {
  MBB_2_GOLD_CARD_SEGMENTS,
  mbb_2_gold_card_href,
  mbb_2_gold_card_nav_label,
  mbb_2_gold_combined_href,
} from "@/lib/credit_cards/mbb_2_gold_routes";

export type NavItem = {
  href: string;
  label: string;
  /** `prefix` marks active for href and nested paths (default `exact`). */
  active_match?: "exact" | "prefix";
  /** Third-level links nested under this item (e.g. MBB 2 Gold cards). */
  children?: NavItem[];
};

export function nav_item_is_active(pathname: string, item: NavItem): boolean {
  if (item.active_match === "prefix") {
    return (
      pathname === item.href || pathname.startsWith(`${item.href}/`)
    );
  }
  return pathname === item.href;
}

export function nav_item_has_active_descendant(
  pathname: string,
  item: NavItem,
): boolean {
  if (!item.children?.length) return false;
  return item.children.some((child) => nav_item_is_active(pathname, child));
}

/** Parent row: active on own page or when a nested child route is open. */
export function nav_item_is_marked(pathname: string, item: NavItem): boolean {
  return (
    nav_item_is_active(pathname, item) ||
    nav_item_has_active_descendant(pathname, item)
  );
}

/** Sidebar row emphasis: full active chrome only on the exact route. */
export function nav_item_route_emphasis(
  pathname: string,
  item: NavItem,
): "active" | "ancestor" | null {
  if (nav_item_is_active(pathname, item)) return "active";
  if (nav_item_has_active_descendant(pathname, item)) return "ancestor";
  return null;
}

export function flatten_nav_hrefs(items: NavItem[]): string[] {
  const hrefs: string[] = [];
  for (const item of items) {
    hrefs.push(item.href);
    if (item.children?.length) {
      hrefs.push(...flatten_nav_hrefs(item.children));
    }
  }
  return hrefs;
}

const MBB_2_GOLD_MEMBER_REFS = new Set(["MBB_VISA_1697", "MBB_AMEX_8060"]);

function build_credit_cards_nav_items(): NavItem[] {
  const mbb_2_gold: NavItem = {
    href: mbb_2_gold_combined_href(),
    label: "MBB 2 Gold",
    active_match: "exact",
    children: MBB_2_GOLD_CARD_SEGMENTS.map((segment) => ({
      href: mbb_2_gold_card_href(segment),
      label: mbb_2_gold_card_nav_label(segment),
      active_match: "prefix" as const,
    })),
  };
  const other = ACCOUNTS.filter(
    (entry) =>
      entry.nav_group === "Credit cards" &&
      entry.show_in_nav !== false &&
      entry.account_ref !== "MBB_2_GOLD" &&
      !MBB_2_GOLD_MEMBER_REFS.has(entry.account_ref),
  ).map((entry) => ({
    href: account_path(entry),
    label: entry.account_label,
  }));
  return [mbb_2_gold, ...other];
}

export type NavGroup = {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

const NAV_GROUP_ORDER: NavGroupKey[] = [
  "Transactions",
  "Credit cards",
  "Wallets",
];

function build_fixed_deposit_nav(bank_codes: string[]): NavItem[] {
  const items: NavItem[] = [{ href: "/fixed-deposits", label: "All" }];
  for (const code of ordered_bank_codes(bank_codes)) {
    items.push({
      href: `/fixed-deposits/${bank_code_to_slug(code)}`,
      label: bank_code_to_label(code),
    });
  }
  return items;
}

function build_account_nav_groups(): NavGroup[] {
  const groups: NavGroup[] = NAV_GROUP_ORDER.map((title) => ({
    title,
    defaultOpen: true,
    items:
      title === "Credit cards"
        ? build_credit_cards_nav_items()
        : ACCOUNTS.filter(
            (entry) => entry.nav_group === title && entry.show_in_nav !== false,
          ).map((entry) => ({
            href: account_path(entry),
            label: entry.account_label,
          })),
  }));
  groups.push({
    title: "Fixed deposits",
    items: build_fixed_deposit_nav(["MBB", "PBE", "HLB"]),
  });
  return groups;
}

export function merge_nav_groups(
  base: NavGroup[],
  bank_codes: string[],
): NavGroup[] {
  return base.map((group) =>
    group.title === "Fixed deposits"
      ? { ...group, items: build_fixed_deposit_nav(bank_codes) }
      : group,
  );
}

export const DASHBOARD_HREF = "/";

export const IMPORT_HREF = "/import";

/** Default sidebar groups (fixed-deposit banks filled at runtime when possible). */
export const NAV_GROUPS: NavGroup[] = build_account_nav_groups();