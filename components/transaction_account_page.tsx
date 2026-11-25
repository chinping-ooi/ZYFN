import { TransactionStatementView } from "@/components/transaction_statement_view";
import { TransactionAppShell } from "@/components/transaction_app_shell";
import { SupabaseStatusPanel } from "@/components/supabase_status_panel";
import { load_account_transactions } from "@/lib/supabase/load_account_transactions";
import { is_account_statement_data } from "@/lib/supabase/account_statement_guards";
import { supabase_configured } from "@/lib/supabase/env";
import { latest_transaction_date } from "@/lib/last_updated";
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

/** Full account route: shell, footer last-updated, and statement body. */
export async function TransactionAccountRoute({
  title,
  config,
}: {
  title: string;
  config: TransactionAccountConfig;
}) {
  if (!supabase_configured()) {
    return (
      <TransactionAppShell title={title}>
        <SupabaseStatusPanel
          result={{
            kind: "missing",
            message:
              "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local to load transactions from Supabase.",
          }}
        />
      </TransactionAppShell>
    );
  }

  const statement = await load_account_transactions(
    config.account_ref,
    config.account_label,
    config.kind,
    config.account_id ?? null,
    config.account_code ?? null,
  );

  const last_updated = is_account_statement_data(statement)
    ? latest_transaction_date(statement.rows)
    : null;

  return (
    <TransactionAppShell title={title} last_updated={last_updated}>
      {is_account_statement_data(statement) ? (
        <TransactionStatementView data={statement} />
      ) : (
        <SupabaseStatusPanel result={statement} />
      )}
    </TransactionAppShell>
  );
}