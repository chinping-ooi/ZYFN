import type { MinorAmount } from "@/lib/money";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { micro_to_sen_display } from "@/lib/tng/money_micro";
import {
  HLB_ACCOUNT,
  MBB_SAVINGS_ACCOUNT,
  PBE_SAVINGS_ACCOUNT,
  TNG_EWALLET_ACCOUNT,
  TNG_GO_PLUS_ACCOUNT,
} from "@/lib/transactions/account_config";

export type DashboardBalanceRow = {
  id: string;
  name: string;
  sub_label: string;
  balance_sen: MinorAmount;
};

function find_statement(
  statements: AccountStatementFromDb[],
  account_ref: string,
): AccountStatementFromDb | undefined {
  return statements.find((s) => s.account_ref === account_ref);
}

function latest_balance_sen(statement: AccountStatementFromDb): number {
  if (statement.amount_scale === "micro") {
    return micro_to_sen_display(statement.closing_micro);
  }
  return statement.closing_sen;
}

/** Savings, wallet, and fixed-deposit rows for the dashboard balance card. */
export function dashboard_account_balances(
  statements: AccountStatementFromDb[],
  fd_active_principal_sen: MinorAmount,
  fd_active_count: number,
): DashboardBalanceRow[] {
  const pbe = find_statement(statements, PBE_SAVINGS_ACCOUNT.account_ref);
  const hlb = find_statement(statements, HLB_ACCOUNT.account_ref);
  const mbb = find_statement(statements, MBB_SAVINGS_ACCOUNT.account_ref);
  const tng_wallet = find_statement(statements, TNG_EWALLET_ACCOUNT.account_ref);
  const tng_go = find_statement(statements, TNG_GO_PLUS_ACCOUNT.account_ref);

  const tng_sen =
    (tng_wallet ? latest_balance_sen(tng_wallet) : 0) +
    (tng_go ? latest_balance_sen(tng_go) : 0);

  const fd_sub =
    fd_active_count > 0
      ? `${fd_active_count} active placement${fd_active_count === 1 ? "" : "s"}`
      : "No active placements";

  return [
    {
      id: "pbe_savings",
      name: "Public Bank Savings",
      sub_label: "Savings account",
      balance_sen: pbe ? latest_balance_sen(pbe) : 0,
    },
    {
      id: "hlb",
      name: "Hong Leong Bank",
      sub_label: "Savings account",
      balance_sen: hlb ? latest_balance_sen(hlb) : 0,
    },
    {
      id: "mbb_savings",
      name: "Maybank Savings",
      sub_label: "Savings account",
      balance_sen: mbb ? latest_balance_sen(mbb) : 0,
    },
    {
      id: "tng",
      name: "TNG",
      sub_label: "eWallet + GO+",
      balance_sen: tng_sen,
    },
    {
      id: "fixed_deposits",
      name: "Fixed deposits",
      sub_label: fd_sub,
      balance_sen: fd_active_principal_sen,
    },
  ];
}