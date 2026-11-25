import type { TransactionAccountKind } from "@/lib/transactions/account_config";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { micro_to_sen_display } from "@/lib/tng/money_micro";

function is_card_ledger_payment(row: TransactionDbRow): boolean {
  const type = row.txn_type.trim().toLowerCase();
  return (
    type.includes("payment") ||
    type === "cc_payment" ||
    type === "card_payment" ||
    type === "credit_card_payment" ||
    type.includes("refund")
  );
}

/**
 * Cash-flow spending amount for dashboard totals and breakdown.
 * Credit cards: purchases are normally `out` (Debit); if stored as `in` when
 * owed increases, count `in` unless the row looks like a payment/credit.
 */
export function cash_flow_spending_sen(
  row: TransactionDbRow,
  account_kind: TransactionAccountKind,
  use_micro: boolean,
): number {
  if (use_micro) {
    return row.out_micro > 0 ? micro_to_sen_display(row.out_micro) : 0;
  }
  if (account_kind === "credit_card") {
    if (row.out_sen > 0) return row.out_sen;
    if (row.in_sen > 0 && !is_card_ledger_payment(row)) {
      return row.in_sen;
    }
    return 0;
  }
  return row.out_sen;
}

export function cash_flow_income_sen(
  row: TransactionDbRow,
  account_kind: TransactionAccountKind,
  use_micro: boolean,
): number {
  if (use_micro) {
    return row.in_micro > 0 ? micro_to_sen_display(row.in_micro) : 0;
  }
  if (account_kind === "credit_card") {
    return row.in_sen;
  }
  return row.in_sen;
}