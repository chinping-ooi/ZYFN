import type { MinorAmount } from "@/lib/money";
import type { HlbDbRow } from "@/lib/supabase/hlb_rows";

export type SupabaseMissing = {
  kind: "missing";
  message: string;
};

export type SupabaseError = {
  kind: "error";
  message: string;
};

export type HlbStatementFromDb = {
  kind: "data";
  account_code: "HLB";
  account_label: string;
  source: "supabase";
  rows: HlbDbRow[];
  total_in_sen: MinorAmount;
  total_out_sen: MinorAmount;
  closing_sen: MinorAmount;
  row_count: number;
};

export type HlbLoadResult = HlbStatementFromDb | SupabaseMissing | SupabaseError;

export function is_hlb_db_data(result: HlbLoadResult): result is HlbStatementFromDb {
  return result.kind === "data";
}