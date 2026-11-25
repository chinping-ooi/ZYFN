export type TransactionAccountKind =
  | "bank"
  | "credit_card"
  | "tng_wallet"
  | "tng_go_plus";

export type NavGroupKey = "Transactions" | "Credit cards" | "Wallets";

export type AccountRoutePrefix = "transactions" | "credit-cards";

export type TransactionAccountConfig = {
  account_ref: string;
  account_label: string;
  kind: TransactionAccountKind;
  account_id?: number;
  account_code?: string;
};

export type AccountRegistryEntry = {
  slug: string;
  route_prefix: AccountRoutePrefix;
  nav_group: NavGroupKey;
  title: string;
  account_ref: string;
  account_label: string;
  kind: TransactionAccountKind;
  account_id?: number;
  account_code?: string;
};