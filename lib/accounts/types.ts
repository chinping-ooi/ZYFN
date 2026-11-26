export type TransactionAccountKind =
  | "bank"
  | "credit_card"
  | "tng_wallet"
  | "tng_go_plus"
  | "tng_combined"
  | "mbb_2_gold_combined";

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
  /** When false, hidden from sidebar (import/data still use the entry). */
  show_in_nav?: boolean;
  /** Summary-only virtual account (no statement route). */
  summary_only?: boolean;
};