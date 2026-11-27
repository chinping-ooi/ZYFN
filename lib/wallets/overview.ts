import type { TransactionAccountKind } from "@/lib/transactions/account_config";

/** Wallets and credit cards: Overview donut is in vs out only (no FD slice). */
export function overview_includes_fd_slice(
  account_kind: TransactionAccountKind,
): boolean {
  return account_kind === "bank";
}