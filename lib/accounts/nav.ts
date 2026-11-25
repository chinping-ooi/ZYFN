import {
  bank_code_to_label,
  bank_code_to_slug,
  ordered_bank_codes,
} from "@/lib/fixed_deposits/banks";
import { ACCOUNTS, account_path } from "@/lib/accounts/registry";
import type { NavGroupKey } from "@/lib/accounts/types";

export type NavItem = {
  href: string;
  label: string;
};

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
    items: ACCOUNTS.filter((entry) => entry.nav_group === title).map(
      (entry) => ({
        href: account_path(entry),
        label: entry.account_label,
      }),
    ),
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

/** Default sidebar groups (fixed-deposit banks filled at runtime when possible). */
export const NAV_GROUPS: NavGroup[] = build_account_nav_groups();