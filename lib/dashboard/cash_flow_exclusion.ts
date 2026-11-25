/**
 * Rows excluded from dashboard income/spending/net/chart (balances unchanged).
 */
export type CashFlowExclusionInput = {
  txn_type: string;
  fixed_deposit_id?: number | null;
  pair_ref?: string | null;
};

function normalise_type(txn_type: string): string {
  return txn_type.trim().toLowerCase();
}

function has_pair_ref(pair_ref: string | null | undefined): boolean {
  return pair_ref != null && String(pair_ref).trim() !== "";
}

function has_fixed_deposit_link(fixed_deposit_id: number | null | undefined): boolean {
  return fixed_deposit_id != null && fixed_deposit_id !== 0;
}

/**
 * Returns true when a ledger row must not count as monthly income or spending.
 *
 * Rules (any match → excluded):
 * - Fixed deposit: `txn_type` is `fd_placement` or `fd_withdrawal`, starts with `fd_`,
 *   or `fixed_deposit_id` is set.
 * - Own-account movement: `txn_type` is `transfer`, or `pair_ref` is set (paired leg).
 * - Card funding from savings: `txn_type` is `card_payment`, `cc_payment`, or
 *   `credit_card_payment` (avoids treating bill pay as merchant spending).
 */
export function is_cash_flow_excluded(row: CashFlowExclusionInput): boolean {
  const type = normalise_type(row.txn_type);

  if (type.startsWith("fd_")) return true;
  if (type === "fd_placement" || type === "fd_withdrawal") return true;
  if (has_fixed_deposit_link(row.fixed_deposit_id)) return true;

  if (has_pair_ref(row.pair_ref)) return true;
  if (type === "transfer") return true;

  if (
    type === "card_payment" ||
    type === "cc_payment" ||
    type === "credit_card_payment"
  ) {
    return true;
  }

  return false;
}