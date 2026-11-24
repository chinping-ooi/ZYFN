export type NavItem = {
  href: string;
  label: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
};

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Transactions",
    defaultOpen: true,
    items: [
      { href: "/transactions/maybank", label: "Maybank" },
      { href: "/transactions/public-bank", label: "Public Bank" },
      { href: "/transactions/hong-leong-bank", label: "Hong Leong Bank" },
    ],
  },
  {
    title: "Wallets",
    items: [{ href: "/wallets/tng", label: "TNG" }],
  },
  {
    title: "Fixed deposits",
    items: [
      { href: "/fixed-deposits/maybank", label: "Maybank" },
      { href: "/fixed-deposits/public-bank", label: "Public Bank" },
    ],
  },
];

export const DASHBOARD_HREF = "/";