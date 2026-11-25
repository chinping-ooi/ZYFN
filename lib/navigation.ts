import {
  bank_code_to_label,
  bank_code_to_slug,
  ordered_bank_codes,
} from "@/lib/fixed_deposits/banks";

export type NavItem = {
  href: string;
  label: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

export function build_fixed_deposit_nav(bank_codes: string[]): NavItem[] {
  const items: NavItem[] = [{ href: "/fixed-deposits", label: "All" }];
  for (const code of ordered_bank_codes(bank_codes)) {
    items.push({
      href: `/fixed-deposits/${bank_code_to_slug(code)}`,
      label: bank_code_to_label(code),
    });
  }
  return items;
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

const BASE_NAV_GROUPS: NavGroup[] = [
  {
    title: "Transactions",
    defaultOpen: true,
    items: [
      { href: "/transactions/pbe", label: "Public Bank Savings" },
      { href: "/transactions/maybank", label: "Maybank Savings" },
      { href: "/transactions/hong-leong-bank", label: "Hong Leong Bank" },
    ],
  },
  {
    title: "Credit cards",
    defaultOpen: true,
    items: [
      { href: "/credit-cards/mbb-visa-1697", label: "MBB Visa 1697" },
      { href: "/credit-cards/mbb-amex-8060", label: "MBB Amex 8060" },
      { href: "/credit-cards/pbe-visa-4104", label: "PBE Visa 4104" },
      {
        href: "/credit-cards/pbe-mastercard-6357",
        label: "PBE Quantum MC 6357",
      },
    ],
  },
  {
    title: "Wallets",
    defaultOpen: true,
    items: [
      { href: "/transactions/tng-ewallet", label: "TNG eWallet" },
      { href: "/transactions/tng-go-plus", label: "TNG GO+" },
    ],
  },
  {
    title: "Fixed deposits",
    items: build_fixed_deposit_nav(["MBB", "PBE", "HLB"]),
  },
];

/** Default sidebar groups (fixed-deposit banks filled at runtime when possible). */
export const NAV_GROUPS: NavGroup[] = BASE_NAV_GROUPS;

export const DASHBOARD_HREF = "/";