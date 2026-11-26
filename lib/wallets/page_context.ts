import {
  account_by_prefix_and_slug,
  to_transaction_config,
} from "@/lib/accounts/registry";
import {
  is_wallet_child_slug,
  WALLET_HREF,
} from "@/lib/wallets/routes";
import type { TransactionAccountConfig } from "@/lib/transactions/account_config";

export type WalletHubPageProps = {
  title: string;
  config: TransactionAccountConfig;
  account_slug: string;
  view_base_path: string;
  wallet_toggle: true;
};

export function resolve_wallet_hub_summary(
  wallet_param: string | undefined,
): WalletHubPageProps | null {
  const child_slug =
    wallet_param && is_wallet_child_slug(wallet_param)
      ? wallet_param
      : null;
  const registry_slug = child_slug ?? "touch-n-go";
  const entry = account_by_prefix_and_slug("transactions", registry_slug);
  if (!entry) return null;

  return {
    title: entry.title,
    config: to_transaction_config(entry),
    account_slug: entry.slug,
    view_base_path: WALLET_HREF,
    wallet_toggle: true,
  };
}