import type { AccountStatementFromDb, AccountStatementResult } from "@/lib/supabase/types";

export function is_account_statement_data(
  result: AccountStatementResult,
): result is AccountStatementFromDb {
  return result.kind === "data";
}