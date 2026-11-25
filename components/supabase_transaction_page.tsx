import { TransactionStatementFromSupabase } from "@/components/transaction_statement_from_supabase";
import { SupabaseStatusPanel } from "@/components/supabase_status_panel";
import { load_account_transactions } from "@/lib/supabase/load_account_transactions";
import { is_account_statement_data } from "@/lib/supabase/types";
import { supabase_configured } from "@/lib/supabase/env";
import type { TransactionAccountConfig } from "@/lib/transactions/account_config";

export async function SupabaseTransactionPage({
  config,
}: {
  config: TransactionAccountConfig;
}) {
  if (!supabase_configured()) {
    return (
      <SupabaseStatusPanel
        result={{
          kind: "missing",
          message:
            "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local to load transactions from Supabase.",
        }}
      />
    );
  }

  const statement = await load_account_transactions(
    config.account_ref,
    config.account_label,
    config.kind,
    config.account_id ?? null,
    config.account_code ?? null,
  );

  if (!is_account_statement_data(statement)) {
    return <SupabaseStatusPanel result={statement} />;
  }

  return <TransactionStatementFromSupabase data={statement} />;
}