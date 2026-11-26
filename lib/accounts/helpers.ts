import type { TransactionAccountKind } from "@/lib/accounts/types";

const TNG_SPENDING_BREAKDOWN_REFS = new Set(["TNG_EWALLET", "TNG_GO_PLUS"]);

export function spending_breakdown_account_bucket(statement: {
  account_ref: string;
  account_label: string;
}): { id: string; label: string } {
  if (TNG_SPENDING_BREAKDOWN_REFS.has(statement.account_ref)) {
    return { id: "tng", label: "Touch 'n Go" };
  }
  return {
    id: statement.account_ref.toLowerCase(),
    label: statement.account_label,
  };
}

export function statement_kpi_labels(kind: TransactionAccountKind) {
  if (kind === "tng_combined") {
    return {
      total_in: "Total in",
      total_out: "Total out",
      closing: "Combined balance",
    };
  }
  if (kind === "credit_card") {
    return {
      total_in: "Total credits",
      total_out: "Total debits",
      closing: "Amount owed",
    };
  }
  return {
    total_in: "Total in",
    total_out: "Total out",
    closing: "Current balance",
  };
}