export type TransactionAccountKind =
  | "bank"
  | "credit_card"
  | "tng_wallet"
  | "tng_go_plus";

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

export const PBE_SAVINGS_ACCOUNT: TransactionAccountConfig = {
  account_ref: "PBE_SAVINGS",
  account_label: "Public Bank Savings",
  account_id: 1,
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

export const PBE_VISA_4104_ACCOUNT: TransactionAccountConfig = {
  account_ref: "PBE_VISA_4104",
  account_label: "Public Bank Visa Gold 4104",
  account_id: 6,
  kind: "credit_card",
};

export const PBE_MASTERCARD_6357_ACCOUNT: TransactionAccountConfig = {
  account_ref: "PBE_MASTERCARD_6357",
  account_label: "Public Bank Quantum MasterCard 6357",
  account_id: 7,
  kind: "credit_card",
};

export const TNG_EWALLET_ACCOUNT: TransactionAccountConfig = {
  account_ref: "TNG_EWALLET",
  account_label: "TNG eWallet",
  account_id: 4,
  kind: "tng_wallet",
};

export const TNG_GO_PLUS_ACCOUNT: TransactionAccountConfig = {
  account_ref: "TNG_GO_PLUS",
  account_label: "TNG GO+",
  account_id: 5,
  kind: "tng_go_plus",
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