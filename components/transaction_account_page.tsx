import { TransactionStatementView } from "@/components/transaction_statement_view";
import { SupabaseStatusPanel } from "@/components/supabase_status_panel";
import { load_account_transactions } from "@/lib/supabase/load_account_transactions";
import { is_account_statement_data } from "@/lib/supabase/account_statement_guards";
import { supabase_configured } from "@/lib/supabase/env";
import type { TransactionAccountConfig } from "@/lib/transactions/account_config";

export type TransactionAccountPageProps = {
  config: TransactionAccountConfig;
};

/** Server loader + shared statement layout for every Supabase account route. */
export async function TransactionAccountPage({
  config,
}: TransactionAccountPageProps) {
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

  return <TransactionStatementView data={statement} />;
}