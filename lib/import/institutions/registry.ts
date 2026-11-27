import { account_config_by_ref } from "@/lib/accounts/registry";
import type { TransactionAccountKind } from "@/lib/accounts/types";
import type { NormalizedImportRow } from "@/lib/import/types";
import type { TransactionTableRow } from "@/components/data_table/transaction_columns";
import * as hlb_savings from "@/lib/import/institutions/hlb_savings";
import * as mbb_savings from "@/lib/import/institutions/mbb_savings";
import * as mbb_card from "@/lib/import/institutions/mbb_card";
import * as pbe_savings from "@/lib/import/institutions/pbe_savings";
import * as pbe_card from "@/lib/import/institutions/pbe_card";
import * as spreadsheet from "@/lib/import/institutions/spreadsheet";
import * as tng_wallet from "@/lib/import/institutions/tng_wallet";

export type InstitutionId =
  | "hlb_savings"
  | "mbb_savings"
  | "mbb_card"
  | "pbe_savings"
  | "pbe_card"
  | "tng_wallet"
  | "spreadsheet";

export type InstitutionModule = {
  row_money_from_direction: typeof hlb_savings.row_money_from_direction;
  validate_running_balance: typeof hlb_savings.validate_running_balance;
  mark_duplicate_matches: (
    rows: NormalizedImportRow[],
    existing: hlb_savings.ExistingTxnForDedupe[],
    account_id?: number,
  ) => void;
  dedupe_query_bounds: typeof hlb_savings.dedupe_query_bounds;
  TXN_SELECT_FOR_DEDUPE: string;
  map_import_row_to_statement_row: (
    row: NormalizedImportRow,
    index: number,
  ) => TransactionTableRow;
};

const MODULES: Record<InstitutionId, InstitutionModule> = {
  hlb_savings,
  mbb_savings,
  mbb_card,
  pbe_savings,
  pbe_card,
  tng_wallet,
  spreadsheet,
};

const PARSER_INSTITUTION: Record<string, InstitutionId> = {
  hlb_savings: "hlb_savings",
  hlb: "hlb_savings",
  mbb_savings: "mbb_savings",
  maybank: "mbb_savings",
  mbb_card: "mbb_card",
  pbe_savings: "pbe_savings",
  pbe: "pbe_savings",
  pbe_card: "pbe_card",
  tng_wallet: "tng_wallet",
  tng_text: "tng_wallet",
  generic: "spreadsheet",
  excel: "spreadsheet",
};

const ACCOUNT_REF_INSTITUTION: Record<string, InstitutionId> = {
  HLB: "hlb_savings",
  MBB_SAVINGS: "mbb_savings",
  MBB_VISA_1697: "mbb_card",
  MBB_AMEX_8060: "mbb_card",
  PBE_SAVINGS: "pbe_savings",
  PBE_VISA_4104: "pbe_card",
  PBE_MASTERCARD_6357: "pbe_card",
  TNG_EWALLET: "tng_wallet",
  TNG_GO_PLUS: "tng_wallet",
  TNG: "tng_wallet",
};

export function institution_for_parser(parser_id: string): InstitutionModule {
  const id = PARSER_INSTITUTION[parser_id] ?? "spreadsheet";
  return MODULES[id];
}

export function institution_for_account(
  account_ref: string,
  account_kind?: TransactionAccountKind,
  account_id?: number,
): InstitutionModule {
  if (account_id === 4 || account_id === 5) return MODULES.tng_wallet;
  if (account_kind === "tng_wallet" || account_kind === "tng_go_plus") {
    return MODULES.tng_wallet;
  }
  if (account_kind === "credit_card") {
    if (account_ref.startsWith("MBB_")) return MODULES.mbb_card;
    if (account_ref.startsWith("PBE_")) return MODULES.pbe_card;
    return MODULES.mbb_card;
  }
  if (account_ref.startsWith("HLB")) return MODULES.hlb_savings;
  if (account_ref.startsWith("MBB_")) return MODULES.mbb_savings;
  if (account_ref.startsWith("PBE_")) return MODULES.pbe_savings;
  const by_ref = ACCOUNT_REF_INSTITUTION[account_ref];
  if (by_ref) return MODULES[by_ref];
  return MODULES.spreadsheet;
}

export function map_import_rows_to_statement_rows(
  rows: NormalizedImportRow[],
): TransactionTableRow[] {
  return rows.map((row, index) => {
    const inst = institution_for_account(
      row.account_ref ?? "",
      row.account_ref
        ? account_config_by_ref(row.account_ref)?.kind
        : undefined,
      row.account_id,
    );
    return inst.map_import_row_to_statement_row(row, index);
  });
}