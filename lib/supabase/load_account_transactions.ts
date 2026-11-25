import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import type { TransactionAccountKind } from "@/lib/transactions/account_config";
import {
  amount_scale_for_account,
  map_transaction_row,
  type ZyfnTransactionRow,
} from "@/lib/supabase/transaction_rows";
import { create_supabase_data_client } from "@/lib/supabase/data_client";
import { supabase_configured } from "@/lib/supabase/env";
import { format_postgrest_error } from "@/lib/supabase/postgrest_error";
import type { AccountStatementResult } from "@/lib/supabase/types";

const PAGE_SIZE = 1000;

const TXN_COLUMNS =
  "id, txn_at, txn_type, description, direction, amount, balance_after, detail";

function account_id_param(id: number | string): number | string {
  if (typeof id === "number") return id;
  const parsed = Number.parseInt(id, 10);
  return Number.isSafeInteger(parsed) ? parsed : id;
}

async function resolve_account_id(
  account_id: number | null,
  account_code: string | null,
): Promise<
  | { ok: true; account_id: number | string; account_code?: string }
  | { ok: false; result: AccountStatementResult }
> {
  if (account_id !== null) {
    return { ok: true, account_id };
  }
  if (!account_code) {
    return {
      ok: false,
      result: {
        kind: "error",
        message: "Account configuration requires account_id or account_code.",
      },
    };
  }

  const supabase = create_supabase_data_client();
  const { data: account, error: account_error } = await supabase
    .from("zyfn_accounts")
    .select("id, code")
    .eq("code", account_code)
    .maybeSingle();

  if (account_error) {
    console.error(`zyfn_accounts (${account_code}):`, account_error.message);
    const formatted = format_postgrest_error(account_error);
    return {
      ok: false,
      result: {
        kind: "error",
        message: `Could not load account ${account_code}: ${formatted.message}`,
        details: formatted.details,
      },
    };
  }

  if (!account) {
    return {
      ok: false,
      result: {
        kind: "error",
        message: `No row in public.zyfn_accounts with code = '${account_code}'.`,
        details:
          "Insert the account row or add a SELECT RLS policy on zyfn_accounts for the publishable role.",
      },
    };
  }

  return {
    ok: true,
    account_id: account_id_param(account.id as number | string),
    account_code,
  };
}

export type LoadAccountTransactionsOptions = {
  /** When true, an empty ledger returns zero rows instead of an error. */
  allow_empty?: boolean;
};

async function load_account_transactions_impl(
  account_ref: string,
  account_label: string,
  kind: TransactionAccountKind,
  account_id: number | null,
  account_code: string | null,
  options: LoadAccountTransactionsOptions = {},
): Promise<AccountStatementResult> {
  const allow_empty = options.allow_empty ?? false;
  noStore();

  if (!supabase_configured()) {
    return {
      kind: "missing",
      message:
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local to load transactions from Supabase.",
    };
  }

  try {
    const resolved = await resolve_account_id(account_id, account_code);
    if (!resolved.ok) {
      return resolved.result;
    }

    const { account_id: resolved_id, account_code: resolved_code } = resolved;
    const supabase = create_supabase_data_client();
    const amount_scale = amount_scale_for_account(kind);

    const raw_rows: ZyfnTransactionRow[] = [];
    let from = 0;
    while (true) {
      const { data: transactions, error: txn_error } = await supabase
        .from("zyfn_transactions")
        .select(TXN_COLUMNS)
        .eq("account_id", resolved_id)
        .order("txn_at", { ascending: false })
        .order("id", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (txn_error) {
        console.error(`zyfn_transactions (${account_ref}):`, txn_error.message);
        const formatted = format_postgrest_error(txn_error);
        return {
          kind: "error",
          message: `Could not load transactions for ${account_label}: ${formatted.message}`,
          details: formatted.details,
        };
      }

      const page = (transactions ?? []) as ZyfnTransactionRow[];
      raw_rows.push(...page);
      if (page.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    if (raw_rows.length === 0) {
      if (allow_empty) {
        return {
          kind: "data",
          account_ref,
          account_code: resolved_code,
          account_label,
          account_kind: kind,
          amount_scale,
          source: "supabase",
          rows: [],
          total_in_sen: 0,
          total_out_sen: 0,
          closing_sen: 0,
          total_in_micro: 0,
          total_out_micro: 0,
          closing_micro: 0,
          row_count: 0,
        };
      }
      return {
        kind: "error",
        message:
          `Supabase returned 0 transaction rows for ${account_label} ` +
          `(account_id ${resolved_id}). With RLS enabled and no matching SELECT policy, ` +
          "PostgREST returns an empty list without an error. Run " +
          "sql/zyfn_transactions_publishable_select_rls.sql in the Supabase SQL editor.",
        details: `account_ref=${account_ref}, account_id=${resolved_id}${
          resolved_code ? `, code=${resolved_code}` : ""
        }`,
      };
    }

    const rows = raw_rows.map((row) => map_transaction_row(row, kind));
    const total_in_sen = rows.reduce((sum, row) => sum + row.in_sen, 0);
    const total_out_sen = rows.reduce((sum, row) => sum + row.out_sen, 0);
    const closing_sen = rows[0]?.balance_sen ?? 0;
    const total_in_micro = rows.reduce((sum, row) => sum + row.in_micro, 0);
    const total_out_micro = rows.reduce((sum, row) => sum + row.out_micro, 0);
    const closing_micro = rows[0]?.balance_micro ?? 0;

    return {
      kind: "data",
      account_ref,
      account_code: resolved_code,
      account_label,
      account_kind: kind,
      amount_scale,
      source: "supabase",
      rows,
      total_in_sen,
      total_out_sen,
      closing_sen,
      total_in_micro,
      total_out_micro,
      closing_micro,
      row_count: rows.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Supabase error";
    console.error(`load_account_transactions (${account_ref}):`, message);
    return { kind: "error", message, details: "Unexpected loader failure" };
  }
}

export function load_account_transactions(
  account_ref: string,
  account_label: string,
  kind: TransactionAccountKind,
  account_id: number | null,
  account_code: string | null,
  options?: LoadAccountTransactionsOptions,
): Promise<AccountStatementResult> {
  return cached_load_account_transactions(
    account_ref,
    account_label,
    kind,
    account_id,
    account_code,
    options ?? {},
  );
}

const cached_load_account_transactions = cache(
  (
    account_ref: string,
    account_label: string,
    kind: TransactionAccountKind,
    account_id: number | null,
    account_code: string | null,
    options: LoadAccountTransactionsOptions,
  ) =>
    load_account_transactions_impl(
      account_ref,
      account_label,
      kind,
      account_id,
      account_code,
      options,
    ),
);