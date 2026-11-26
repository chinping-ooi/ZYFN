import { ACCOUNTS, DASHBOARD_ACCOUNTS } from "@/lib/accounts/registry";
import type { AmountScale } from "@/lib/supabase/transaction_rows";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import {
  filter_tng_rows_for_go_plus_visibility,
  merge_tng_statement_rows,
  wallet_row_to_combined_view,
} from "@/lib/tng/combined_statement";
import { statement_kpi_labels } from "@/lib/transactions/account_config";
import type { TransactionAccountKind } from "@/lib/accounts/types";

const DASHBOARD_ACCOUNT_REFS_SET = new Set(
  DASHBOARD_ACCOUNTS.map((a) => a.account_ref),
);

export const DASHBOARD_SUMMARY_ACCOUNT_ALL = "all";

export const DASHBOARD_SUMMARY_ACCOUNT_STORAGE_KEY =
  "zyfn_dashboard_summary_account";

export type DashboardSummaryAccountOption = {
  value: string;
  label: string;
};

/** Sidebar-visible accounts plus All accounts (first). */
export function dashboard_summary_account_options(): DashboardSummaryAccountOption[] {
  return [
    { value: DASHBOARD_SUMMARY_ACCOUNT_ALL, label: "All accounts" },
    ...ACCOUNTS.filter((entry) => entry.show_in_nav !== false).map((entry) => ({
      value: entry.account_ref,
      label: entry.account_label,
    })),
  ];
}

function tng_wallet_rows(statements: AccountStatementFromDb[]): TransactionDbRow[] {
  const wallet = statements.find((s) => s.account_ref === "TNG_EWALLET");
  const go = statements.find((s) => s.account_ref === "TNG_GO_PLUS");
  if (!wallet && !go) return [];
  const merged = merge_tng_statement_rows(
    wallet?.rows ?? [],
    go?.rows ?? [],
  );
  return filter_tng_rows_for_go_plus_visibility(merged, false);
}

function prepare_row_for_aggregate(
  row: TransactionDbRow,
  statement: AccountStatementFromDb,
): TransactionDbRow {
  if (statement.account_kind === "tng_go_plus") {
    return { ...row, tng_sub_account: "go_plus" as const };
  }
  if (statement.account_kind === "tng_wallet") {
    return wallet_row_to_combined_view(row);
  }
  return row;
}

/**
 * Ledger rows for dashboard summary charts (GO+ hidden for TNG; all = every
 * dashboard account, transfers included as-is).
 */
export function dashboard_summary_source_rows(
  statements: AccountStatementFromDb[],
  account_key: string,
): TransactionDbRow[] {
  if (account_key === DASHBOARD_SUMMARY_ACCOUNT_ALL) {
    const rows: TransactionDbRow[] = [];
    const seen_tng = new Set<string>();
    for (const statement of statements) {
      if (
        statement.account_ref === "TNG_GO_PLUS" ||
        statement.account_ref === "TNG_EWALLET"
      ) {
        if (seen_tng.has("tng")) continue;
        seen_tng.add("tng");
        rows.push(...tng_wallet_rows(statements));
        continue;
      }
      if (!DASHBOARD_ACCOUNT_REFS_SET.has(statement.account_ref)) continue;
      rows.push(
        ...statement.rows.map((row) => prepare_row_for_aggregate(row, statement)),
      );
    }
    return rows;
  }

  if (account_key === "TNG") {
    return tng_wallet_rows(statements);
  }

  const statement = statements.find((s) => s.account_ref === account_key);
  if (!statement) return [];
  return statement.rows.map((row) => prepare_row_for_aggregate(row, statement));
}

export function dashboard_summary_amount_scale(
  account_key: string,
  statements: AccountStatementFromDb[],
): AmountScale {
  if (account_key === "TNG") return "micro";
  if (account_key === DASHBOARD_SUMMARY_ACCOUNT_ALL) return "sen";
  const statement = statements.find((s) => s.account_ref === account_key);
  return statement?.amount_scale ?? "sen";
}

export function dashboard_summary_money_dp(scale: AmountScale): 2 | 4 {
  return scale === "micro" ? 4 : 2;
}

export function dashboard_summary_kpi_labels(
  account_key: string,
  statements: AccountStatementFromDb[],
): ReturnType<typeof statement_kpi_labels> {
  if (account_key === DASHBOARD_SUMMARY_ACCOUNT_ALL) {
    return statement_kpi_labels("bank");
  }
  if (account_key === "TNG") {
    return statement_kpi_labels("tng_combined");
  }
  const statement = statements.find((s) => s.account_ref === account_key);
  const kind: TransactionAccountKind = statement?.account_kind ?? "bank";
  return statement_kpi_labels(kind);
}

export function read_dashboard_summary_account_pref(): string {
  if (typeof window === "undefined") return DASHBOARD_SUMMARY_ACCOUNT_ALL;
  const stored = window.localStorage.getItem(DASHBOARD_SUMMARY_ACCOUNT_STORAGE_KEY);
  if (!stored) return DASHBOARD_SUMMARY_ACCOUNT_ALL;
  const valid = dashboard_summary_account_options().some((o) => o.value === stored);
  return valid ? stored : DASHBOARD_SUMMARY_ACCOUNT_ALL;
}

export function write_dashboard_summary_account_pref(account_key: string): void {
  window.localStorage.setItem(DASHBOARD_SUMMARY_ACCOUNT_STORAGE_KEY, account_key);
}