import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import {
  map_transaction_to_hlb_row,
  type ZyfnTransactionRow,
} from "@/lib/supabase/hlb_rows";
import { create_supabase_data_client } from "@/lib/supabase/data_client";
import { supabase_configured } from "@/lib/supabase/env";
import type { HlbLoadResult } from "@/lib/supabase/types";

const HLB_CODE = "HLB";
const PAGE_SIZE = 1000;

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
      return { kind: "error", message: account_error.message };
    }
    if (!account) {
      return {
        kind: "error",
        message: `No row in zyfn_accounts with code = '${HLB_CODE}'.`,
      };
    }

    const { data: transactions, error: txn_error } = await supabase
      .from("zyfn_transactions")
      .select(
        "id, txn_at, txn_type, description, direction, amount, balance_after, detail",
      )
      .eq("account_id", account.id)
      .order("txn_at", { ascending: true })
      .order("id", { ascending: true })
      .range(0, PAGE_SIZE - 1);

    if (txn_error) {
      return { kind: "error", message: txn_error.message };
    }

    const rows = (transactions ?? []).map((row) =>
      map_transaction_to_hlb_row(row as ZyfnTransactionRow),
    );

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
    return { kind: "error", message };
  }
}

export const load_hlb_statement = cache(load_hlb_statement_impl);