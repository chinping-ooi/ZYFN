import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import {
  map_transaction_to_hlb_row,
  type ZyfnTransactionRow,
} from "@/lib/supabase/hlb_rows";
import { create_supabase_data_client } from "@/lib/supabase/data_client";
import { supabase_configured } from "@/lib/supabase/env";
import { format_postgrest_error } from "@/lib/supabase/postgrest_error";
import type { HlbLoadResult } from "@/lib/supabase/types";

const HLB_CODE = "HLB";
const PAGE_SIZE = 1000;

const TXN_COLUMNS =
  "id, txn_at, txn_type, description, direction, amount, balance_after, detail";

function account_id_param(id: number | string): number | string {
  if (typeof id === "number") return id;
  const parsed = Number.parseInt(id, 10);
  return Number.isSafeInteger(parsed) ? parsed : id;
}

async function load_hlb_statement_impl(): Promise<HlbLoadResult> {
  noStore();

  if (!supabase_configured()) {
    return {
      kind: "missing",
      message:
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local to load Hong Leong Bank transactions from Supabase.",
    };
  }

  try {
    const supabase = create_supabase_data_client();

    const { data: account, error: account_error } = await supabase
      .from("zyfn_accounts")
      .select("id, code")
      .eq("code", HLB_CODE)
      .maybeSingle();

    if (account_error) {
      console.error("zyfn_accounts (HLB):", account_error.message);
      const formatted = format_postgrest_error(account_error);
      return {
        kind: "error",
        message: `Could not load account HLB: ${formatted.message}`,
        details: formatted.details,
      };
    }

    if (!account) {
      return {
        kind: "error",
        message: `No row in public.zyfn_accounts with code = '${HLB_CODE}'.`,
        details:
          "Insert the HLB account row or add a SELECT RLS policy on zyfn_accounts for the publishable role.",
      };
    }

    const account_id = account_id_param(account.id as number | string);

    const { data: transactions, error: txn_error } = await supabase
      .from("zyfn_transactions")
      .select(TXN_COLUMNS)
      .eq("account_id", account_id)
      .order("txn_at", { ascending: true })
      .order("id", { ascending: true })
      .range(0, PAGE_SIZE - 1);

    if (txn_error) {
      console.error("zyfn_transactions (HLB):", txn_error.message);
      const formatted = format_postgrest_error(txn_error);
      return {
        kind: "error",
        message: `Could not load transactions for HLB: ${formatted.message}`,
        details: formatted.details,
      };
    }

    const raw_rows = (transactions ?? []) as ZyfnTransactionRow[];

    if (raw_rows.length === 0) {
      return {
        kind: "error",
        message:
          "Supabase returned 0 transaction rows for HLB (account_id " +
          `${account_id}). With RLS enabled and no matching SELECT policy, ` +
          "PostgREST returns an empty list without an error — the same pattern " +
          "as fixed deposits before policies are added. Run " +
          "sql/zyfn_transactions_publishable_select_rls.sql in the Supabase SQL editor.",
        details: `code=${HLB_CODE}, account_id=${account_id}`,
      };
    }

    const rows = raw_rows.map((row) => map_transaction_to_hlb_row(row));

    const total_in_sen = rows.reduce((sum, row) => sum + row.in_sen, 0);
    const total_out_sen = rows.reduce((sum, row) => sum + row.out_sen, 0);
    const closing_sen = rows.at(-1)?.balance_sen ?? 0;

    return {
      kind: "data",
      account_code: HLB_CODE,
      account_label: "Hong Leong Bank",
      source: "supabase",
      rows,
      total_in_sen,
      total_out_sen,
      closing_sen,
      row_count: rows.length,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Supabase error";
    console.error("load_hlb_statement:", message);
    return { kind: "error", message, details: "Unexpected loader failure" };
  }
}

export const load_hlb_statement = cache(load_hlb_statement_impl);