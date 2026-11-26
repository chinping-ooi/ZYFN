import type { CashFlowExclusionInput } from "@/lib/dashboard/cash_flow_exclusion";
import { is_fd_category_text } from "@/lib/dashboard/spending_donut_fd";
import type { TransactionAccountKind } from "@/lib/transactions/account_config";

export type CashFlowExclusionContext = {
  account_kind?: TransactionAccountKind;
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

/** When excluded, returns a short rule label for audits and scripts. */
export function cash_flow_exclusion_reason(
  row: CashFlowExclusionInput,
  context?: CashFlowExclusionContext,
): string | null {
  const type = normalise_type(row.txn_type);

  if (is_fd_category_text(row.txn_type)) return "fixed_deposit_txn_type";
  if (has_fixed_deposit_link(row.fixed_deposit_id)) return "fixed_deposit_id";

  if (has_pair_ref(row.pair_ref)) return "pair_ref";

  if (
    type === "card_payment" ||
    type === "cc_payment" ||
    type === "credit_card_payment"
  ) {
    if (context?.account_kind === "credit_card") {
      return null;
    }
    return "card_payment_from_savings";
  }

  return null;
}