import { create_supabase_data_client } from "@/lib/supabase/data_client";
import { supabase_configured } from "@/lib/supabase/env";
import { format_postgrest_error } from "@/lib/supabase/postgrest_error";
import { row_money_from_direction } from "@/lib/import/amount";
import {
  existing_dedupe_keys,
  mark_duplicates,
} from "@/lib/import/dedupe";
import { validate_running_balance } from "@/lib/import/validate";
import type {
  ImportConfirmResult,
  ImportConfirmRow,
  ImportSourceKind,
  NormalizedImportRow,
} from "@/lib/import/types";

const TXN_SELECT =
  "txn_at, amount, description, balance_after";

export async function dedupe_import_rows(
  account_id: number,
  rows: NormalizedImportRow[],
): Promise<NormalizedImportRow[]> {
  if (!supabase_configured()) {
    throw new Error("Supabase is not configured");
  }
  const dates = rows.map((r) => r.txn_at.slice(0, 10)).sort();
  const min = dates[0];
  const max = dates.at(-1);
  if (!min || !max) return rows;

  const supabase = create_supabase_data_client();
  const { data, error } = await supabase
    .from("zyfn_transactions")
    .select(TXN_SELECT)
    .eq("account_id", account_id)
    .gte("txn_at", `${min}T00:00:00Z`)
    .lte("txn_at", `${max}T23:59:59Z`);

  if (error) {
    const formatted = format_postgrest_error(error);
    throw new Error(
      `Could not load existing transactions for dedupe: ${formatted.message}`,
    );
  }

  const keys = existing_dedupe_keys(account_id, data ?? []);
  const working = rows.map((r) => ({ ...r, review_reasons: [...r.review_reasons] }));
  mark_duplicates(account_id, working, keys);
  validate_running_balance(working);
  return working;
}

export async function confirm_import_rows(input: {
  account_id: number;
  account_ref: string;
  source_filename: string;
  source_kind: ImportSourceKind;
  rows: ImportConfirmRow[];
}): Promise<ImportConfirmResult> {
  if (!supabase_configured()) {
    return {
      inserted: 0,
      skipped_duplicates: 0,
      batch_id: null,
      error: "Supabase is not configured",
    };
  }

  const supabase = create_supabase_data_client();
  const preview_like: NormalizedImportRow[] = input.rows.map((row, i) => {
    const money = row_money_from_direction(
      row.direction,
      row.amount_major,
      row.balance_after_major,
    );
    return {
      ...row,
      temp_id: row.temp_id || `c-${i}`,
      ...money,
      status: "new" as const,
      review_reasons: [] as string[],
    };
  });
  const deduped = await dedupe_import_rows(input.account_id, preview_like);
  const insert_rows = deduped.filter((r) => r.status === "new");
  const skipped = deduped.length - insert_rows.length;

  if (insert_rows.length === 0) {
    return {
      inserted: 0,
      skipped_duplicates: skipped,
      batch_id: null,
    };
  }

  const payload = insert_rows.map((row) => ({
    account_id: input.account_id,
    txn_at: row.txn_at,
    txn_type: row.txn_type || null,
    description: row.description,
    direction: row.direction,
    amount: row.amount_major,
    balance_after: row.balance_after_major,
    detail: row.detail || null,
  }));

  const { data: inserted, error: insert_error } = await supabase
    .from("zyfn_transactions")
    .insert(payload)
    .select("id");

  if (insert_error) {
    const formatted = format_postgrest_error(insert_error);
    return {
      inserted: 0,
      skipped_duplicates: skipped,
      batch_id: null,
      error:
        `Insert blocked (${formatted.message}). Ensure INSERT RLS on zyfn_transactions ` +
        "and run supabase/migrations/202603260001_zyfn_import_batches.sql.",
    };
  }

  const { data: batch, error: batch_error } = await supabase
    .from("zyfn_import_batches")
    .insert({
      account_id: input.account_id,
      source_filename: input.source_filename,
      source_kind: input.source_kind,
      row_count: input.rows.length,
      inserted_count: inserted?.length ?? 0,
      skipped_duplicate_count: skipped,
    })
    .select("id")
    .single();

  if (batch_error) {
    return {
      inserted: inserted?.length ?? 0,
      skipped_duplicates: skipped,
      batch_id: null,
      error: `Transactions inserted but batch log failed: ${batch_error.message}`,
    };
  }

  return {
    inserted: inserted?.length ?? 0,
    skipped_duplicates: skipped,
    batch_id: batch?.id ?? null,
  };
}