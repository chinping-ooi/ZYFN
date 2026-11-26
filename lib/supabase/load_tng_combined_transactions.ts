import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import {
  combined_tng_closing_sen,
  merge_tng_statement_rows,
} from "@/lib/tng/combined_statement";
import { load_account_transactions } from "@/lib/supabase/load_account_transactions";
import { is_account_statement_data } from "@/lib/supabase/account_statement_guards";
import type { AccountStatementResult } from "@/lib/supabase/types";
import {
  TNG_EWALLET_ACCOUNT,
  TNG_GO_PLUS_ACCOUNT,
} from "@/lib/transactions/account_config";

async function load_tng_combined_transactions_impl(): Promise<AccountStatementResult> {
  noStore();

  const [wallet, go_plus] = await Promise.all([
    load_account_transactions(
      TNG_EWALLET_ACCOUNT.account_ref,
      TNG_EWALLET_ACCOUNT.account_label,
      "tng_wallet",
      TNG_EWALLET_ACCOUNT.account_id ?? null,
      TNG_EWALLET_ACCOUNT.account_code ?? null,
      { allow_empty: true },
    ),
    load_account_transactions(
      TNG_GO_PLUS_ACCOUNT.account_ref,
      TNG_GO_PLUS_ACCOUNT.account_label,
      "tng_go_plus",
      TNG_GO_PLUS_ACCOUNT.account_id ?? null,
      TNG_GO_PLUS_ACCOUNT.account_code ?? null,
      { allow_empty: true },
    ),
  ]);

  if (!is_account_statement_data(wallet) && wallet.kind !== "missing") {
    return wallet;
  }
  if (!is_account_statement_data(go_plus) && go_plus.kind !== "missing") {
    return go_plus;
  }

  if (wallet.kind === "missing" || go_plus.kind === "missing") {
    return {
      kind: "missing",
      message:
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local to load transactions from Supabase.",
    };
  }

  const wallet_rows =
    wallet.kind === "data" ? wallet.rows : [];
  const go_rows = go_plus.kind === "data" ? go_plus.rows : [];
  const rows = merge_tng_statement_rows(wallet_rows, go_rows);

  if (rows.length === 0) {
    return {
      kind: "error",
      message:
        "Supabase returned 0 transaction rows for Touch 'n Go (eWallet + GO+).",
      details:
        "Ensure both TNG accounts have data and publishable SELECT RLS on zyfn_transactions.",
    };
  }

  const closing_sen = combined_tng_closing_sen(wallet_rows, go_rows);
  const wallet_closing_micro = wallet_rows[0]?.balance_sen
    ? wallet_rows[0].balance_sen * 100
    : 0;
  const go_closing_micro = go_rows[0]?.balance_micro ?? 0;

  return {
    kind: "data",
    account_ref: "TNG",
    account_label: "Touch 'n Go",
    account_kind: "tng_combined",
    amount_scale: "micro",
    source: "supabase",
    rows,
    total_in_sen: rows.reduce((t, row) => t + row.in_sen, 0),
    total_out_sen: rows.reduce((t, row) => t + row.out_sen, 0),
    closing_sen,
    total_in_micro: rows.reduce((t, row) => t + row.in_micro, 0),
    total_out_micro: rows.reduce((t, row) => t + row.out_micro, 0),
    closing_micro: wallet_closing_micro + go_closing_micro,
    row_count: rows.length,
  };
}

export const load_tng_combined_transactions = cache(
  load_tng_combined_transactions_impl,
);