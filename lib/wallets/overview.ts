import type { TransactionAccountKind } from "@/lib/transactions/account_config";

/** TNG wallet routes: Overview donut is in vs out only (no FD slice). */
export function overview_includes_fd_slice(
  account_kind: TransactionAccountKind,
): boolean {
  return (
    account_kind !== "tng_combined" &&
    account_kind !== "tng_wallet" &&
    account_kind !== "tng_go_plus"
  );
}