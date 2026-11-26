import { unstable_noStore as noStore } from "next/cache";
import { cache } from "react";
import {
  combined_mbb_2_gold_closing_sen,
  MBB_2_GOLD_ACCOUNT_REF,
  MBB_2_GOLD_LABEL,
  prepare_mbb_2_gold_combined_rows,
} from "@/lib/credit_cards/mbb_2_gold_combined";
import { load_account_transactions } from "@/lib/supabase/load_account_transactions";
import { is_account_statement_data } from "@/lib/supabase/account_statement_guards";
import type { AccountStatementResult } from "@/lib/supabase/types";
import {
  MBB_AMEX_ACCOUNT,
  MBB_VISA_ACCOUNT,
} from "@/lib/transactions/account_config";

async function load_mbb_2_gold_combined_transactions_impl(): Promise<AccountStatementResult> {
  noStore();

  const [visa, amex] = await Promise.all([
    load_account_transactions(
      MBB_VISA_ACCOUNT.account_ref,
      MBB_VISA_ACCOUNT.account_label,
      "credit_card",
      MBB_VISA_ACCOUNT.account_id ?? null,
      MBB_VISA_ACCOUNT.account_code ?? null,
      { allow_empty: true },
    ),
    load_account_transactions(
      MBB_AMEX_ACCOUNT.account_ref,
      MBB_AMEX_ACCOUNT.account_label,
      "credit_card",
      MBB_AMEX_ACCOUNT.account_id ?? null,
      MBB_AMEX_ACCOUNT.account_code ?? null,
      { allow_empty: true },
    ),
  ]);

  if (!is_account_statement_data(visa) && visa.kind !== "missing") {
    return visa;
  }
  if (!is_account_statement_data(amex) && amex.kind !== "missing") {
    return amex;
  }

  if (visa.kind === "missing" || amex.kind === "missing") {
    return {
      kind: "missing",
      message:
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local to load transactions from Supabase.",
    };
  }

  const visa_rows = visa.kind === "data" ? visa.rows : [];
  const amex_rows = amex.kind === "data" ? amex.rows : [];
  const rows = prepare_mbb_2_gold_combined_rows(visa_rows, amex_rows);

  if (rows.length === 0) {
    return {
      kind: "error",
      message:
        "Supabase returned 0 transaction rows for MBB 2 Gold (Visa 1697 + Amex 8060).",
      details:
        "Ensure both card accounts have data and publishable SELECT RLS on zyfn_transactions.",
    };
  }

  const closing_sen = combined_mbb_2_gold_closing_sen(visa_rows, amex_rows);

  return {
    kind: "data",
    account_ref: MBB_2_GOLD_ACCOUNT_REF,
    account_label: MBB_2_GOLD_LABEL,
    account_kind: "mbb_2_gold_combined",
    amount_scale: "sen",
    source: "supabase",
    rows,
    total_in_sen: rows.reduce((t, row) => t + row.in_sen, 0),
    total_out_sen: rows.reduce((t, row) => t + row.out_sen, 0),
    closing_sen,
    total_in_micro: 0,
    total_out_micro: 0,
    closing_micro: 0,
    row_count: rows.length,
  };
}

export const load_mbb_2_gold_combined_transactions = cache(
  load_mbb_2_gold_combined_transactions_impl,
);