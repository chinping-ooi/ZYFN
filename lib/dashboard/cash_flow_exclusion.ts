import {
  cash_flow_exclusion_reason,
  type CashFlowExclusionContext,
} from "@/lib/dashboard/cash_flow_exclusion_reason";

/**
 * Rows excluded from dashboard income/spending/net/chart (balances unchanged).
 */
export type CashFlowExclusionInput = {
  txn_type: string;
  fixed_deposit_id?: number | null;
  pair_ref?: string | null;
};

/**
 * Returns true when a ledger row must not count as monthly income or spending.
 *
 * Rules (any match → excluded):
 * - Fixed deposit: `txn_type` is `fd_placement` or `fd_withdrawal`, starts with `fd_`,
 *   or `fixed_deposit_id` is set.
 * - Own-account movement: `pair_ref` is set (paired leg). Unpaired `transfer` rows
 *   still count (e.g. incoming salary mis-tagged as transfer).
 * - Card bill pay: `txn_type` is `card_payment`, `cc_payment`, or
 *   `credit_card_payment` on savings or credit-card accounts (purchases still count).
 */
export function is_cash_flow_excluded(
  row: CashFlowExclusionInput,
  context?: CashFlowExclusionContext,
): boolean {
  return cash_flow_exclusion_reason(row, context) != null;
}