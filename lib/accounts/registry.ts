import type {
  AccountRegistryEntry,
  AccountRoutePrefix,
  TransactionAccountConfig,
} from "@/lib/accounts/types";

export const ACCOUNTS: AccountRegistryEntry[] = [
  {
    slug: "pbe",
    route_prefix: "transactions",
    nav_group: "Transactions",
    title: "Public Bank Savings",
    account_ref: "PBE_SAVINGS",
    account_label: "Public Bank Savings",
    account_id: 1,
    kind: "bank",
  },
  {
    slug: "maybank",
    route_prefix: "transactions",
    nav_group: "Transactions",
    title: "Maybank Savings",
    account_ref: "MBB_SAVINGS",
    account_label: "Maybank Savings",
    account_id: 3,
    kind: "bank",
  },
  {
    slug: "hong-leong-bank",
    route_prefix: "transactions",
    nav_group: "Transactions",
    title: "Hong Leong Bank",
    account_ref: "HLB",
    account_label: "Hong Leong Bank",
    account_code: "HLB",
    kind: "bank",
  },
  {
    slug: "mbb-visa-1697",
    route_prefix: "credit-cards",
    nav_group: "Credit cards",
    title: "MBB Visa 1697",
    account_ref: "MBB_VISA_1697",
    account_label: "MBB Visa 1697",
    account_id: 8,
    kind: "credit_card",
  },
  {
    slug: "mbb-amex-8060",
    route_prefix: "credit-cards",
    nav_group: "Credit cards",
    title: "MBB Amex 8060",
    account_ref: "MBB_AMEX_8060",
    account_label: "MBB Amex 8060",
    account_id: 9,
    kind: "credit_card",
  },
  {
    slug: "pbe-visa-4104",
    route_prefix: "credit-cards",
    nav_group: "Credit cards",
    title: "Public Bank Visa Gold 4104",
    account_ref: "PBE_VISA_4104",
    account_label: "Public Bank Visa Gold 4104",
    account_id: 6,
    kind: "credit_card",
  },
  {
    slug: "pbe-mastercard-6357",
    route_prefix: "credit-cards",
    nav_group: "Credit cards",
    title: "Public Bank Quantum MasterCard 6357",
    account_ref: "PBE_MASTERCARD_6357",
    account_label: "Public Bank Quantum MasterCard 6357",
    account_id: 7,
    kind: "credit_card",
  },
  {
    slug: "tng-ewallet",
    route_prefix: "transactions",
    nav_group: "Wallets",
    title: "TNG eWallet",
    account_ref: "TNG_EWALLET",
    account_label: "TNG eWallet",
    account_id: 4,
    kind: "tng_wallet",
  },
  {
    slug: "tng-go-plus",
    route_prefix: "transactions",
    nav_group: "Wallets",
    title: "TNG GO+",
    account_ref: "TNG_GO_PLUS",
    account_label: "TNG GO+",
    account_id: 5,
    kind: "tng_go_plus",
  },
];

export function account_path(entry: AccountRegistryEntry): string {
  return `/${entry.route_prefix}/${entry.slug}`;
}

export function to_transaction_config(
  entry: AccountRegistryEntry,
): TransactionAccountConfig {
  return {
    account_ref: entry.account_ref,
    account_label: entry.account_label,
    kind: entry.kind,
    account_id: entry.account_id,
    account_code: entry.account_code,
  };
}

const DASHBOARD_ACCOUNT_REFS: string[] = [
  "HLB",
  "PBE_SAVINGS",
  "MBB_SAVINGS",
  "MBB_VISA_1697",
  "MBB_AMEX_8060",
  "PBE_VISA_4104",
  "PBE_MASTERCARD_6357",
  "TNG_EWALLET",
  "TNG_GO_PLUS",
];

export const DASHBOARD_ACCOUNTS: TransactionAccountConfig[] =
  DASHBOARD_ACCOUNT_REFS.map((ref) => {
    const entry = ACCOUNTS.find((a) => a.account_ref === ref);
    if (!entry) throw new Error(`Missing dashboard account: ${ref}`);
    return to_transaction_config(entry);
  });

export function accounts_for_route_prefix(
  prefix: AccountRoutePrefix,
): AccountRegistryEntry[] {
  return ACCOUNTS.filter((entry) => entry.route_prefix === prefix);
}

export function account_by_prefix_and_slug(
  prefix: AccountRoutePrefix,
  slug: string,
): AccountRegistryEntry | undefined {
  return ACCOUNTS.find(
    (entry) => entry.route_prefix === prefix && entry.slug === slug,
  );
}

export function account_config_by_ref(
  account_ref: string,
): TransactionAccountConfig | undefined {
  const entry = ACCOUNTS.find((a) => a.account_ref === account_ref);
  return entry ? to_transaction_config(entry) : undefined;
}