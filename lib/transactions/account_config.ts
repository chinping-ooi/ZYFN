export type TransactionAccountKind = "bank" | "credit_card";

export type TransactionAccountConfig = {
  account_ref: string;
  account_label: string;
  kind: TransactionAccountKind;
  account_id?: number;
  account_code?: string;
};

export const HLB_ACCOUNT: TransactionAccountConfig = {
  account_ref: "HLB",
  account_label: "Hong Leong Bank",
  account_code: "HLB",
  kind: "bank",
};

export const MBB_SAVINGS_ACCOUNT: TransactionAccountConfig = {
  account_ref: "MBB_SAVINGS",
  account_label: "Maybank Savings",
  account_id: 3,
  kind: "bank",
};

export const MBB_VISA_ACCOUNT: TransactionAccountConfig = {
  account_ref: "MBB_VISA_1697",
  account_label: "MBB Visa 1697",
  account_id: 8,
  kind: "credit_card",
};

export const MBB_AMEX_ACCOUNT: TransactionAccountConfig = {
  account_ref: "MBB_AMEX_8060",
  account_label: "MBB Amex 8060",
  account_id: 9,
  kind: "credit_card",
};

export function statement_kpi_labels(kind: TransactionAccountKind) {
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