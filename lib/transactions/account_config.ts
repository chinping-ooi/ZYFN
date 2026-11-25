export type {
  TransactionAccountKind,
  TransactionAccountConfig,
} from "@/lib/accounts/types";
export {
  ACCOUNTS,
  DASHBOARD_ACCOUNTS,
  to_transaction_config,
  account_config_by_ref,
} from "@/lib/accounts/registry";
export {
  statement_kpi_labels,
  spending_breakdown_account_bucket,
} from "@/lib/accounts/helpers";

import { account_config_by_ref } from "@/lib/accounts/registry";

export const HLB_ACCOUNT = account_config_by_ref("HLB")!;
export const PBE_SAVINGS_ACCOUNT = account_config_by_ref("PBE_SAVINGS")!;
export const MBB_SAVINGS_ACCOUNT = account_config_by_ref("MBB_SAVINGS")!;
export const MBB_VISA_ACCOUNT = account_config_by_ref("MBB_VISA_1697")!;
export const MBB_AMEX_ACCOUNT = account_config_by_ref("MBB_AMEX_8060")!;
export const PBE_VISA_4104_ACCOUNT = account_config_by_ref("PBE_VISA_4104")!;
export const PBE_MASTERCARD_6357_ACCOUNT =
  account_config_by_ref("PBE_MASTERCARD_6357")!;
export const TNG_EWALLET_ACCOUNT = account_config_by_ref("TNG_EWALLET")!;
export const TNG_GO_PLUS_ACCOUNT = account_config_by_ref("TNG_GO_PLUS")!;