import { TransactionStatementView } from "@/components/transaction_statement_view";
import { TngCombinedStatementView } from "@/components/tng_combined_statement_view";
import { TransactionAppShell } from "@/components/transaction_app_shell";
import { SupabaseStatusPanel } from "@/components/supabase_status_panel";
import { load_account_transactions } from "@/lib/supabase/load_account_transactions";
import { load_tng_combined_transactions } from "@/lib/supabase/load_tng_combined_transactions";
import { is_account_statement_data } from "@/lib/supabase/account_statement_guards";
import { supabase_configured } from "@/lib/supabase/env";
import { latest_transaction_date } from "@/lib/last_updated";
import type { AccountRoutePrefix } from "@/lib/accounts/types";
import type { TransactionAccountConfig } from "@/lib/transactions/account_config";

/** Full account route: shell, footer last-updated, and statement body. */
export async function TransactionAccountRoute({
  title,
  config,
  account_slug,
  route_prefix,
}: {
  title: string;
  config: TransactionAccountConfig;
  account_slug: string;
  route_prefix: AccountRoutePrefix;
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

  const statement =
    config.kind === "tng_combined"
      ? await load_tng_combined_transactions()
      : await load_account_transactions(
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
        config.kind === "tng_combined" ? (
          <TngCombinedStatementView
            data={statement}
            account_slug={account_slug}
          />
        ) : (
          <TransactionStatementView
            data={statement}
            route_prefix={route_prefix}
            account_slug={account_slug}
          />
        )
      ) : (
        <SupabaseStatusPanel result={statement} />
      )}
    </TransactionAppShell>
  );
}