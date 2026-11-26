import { StatementViewSuspense } from "@/components/statement_view_suspense";
import { TransactionStatementView } from "@/components/transaction_statement_view";
import { TransactionAppShell } from "@/components/transaction_app_shell";
import { SupabaseStatusPanel } from "@/components/supabase_status_panel";
import { load_mbb_2_gold_combined_transactions } from "@/lib/supabase/load_mbb_2_gold_combined_transactions";
import { is_account_statement_data } from "@/lib/supabase/account_statement_guards";
import { supabase_configured } from "@/lib/supabase/env";
import { latest_transaction_date } from "@/lib/last_updated";
import { account_by_prefix_and_slug } from "@/lib/accounts/registry";
import { mbb_2_gold_combined_href } from "@/lib/credit_cards/mbb_2_gold_routes";

export async function Mbb2GoldCombinedStatementPage() {
  const entry = account_by_prefix_and_slug("credit-cards", "mbb-2-gold");
  const title = entry?.title ?? "MBB 2 Gold";

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

  const combined = await load_mbb_2_gold_combined_transactions();

  if (!is_account_statement_data(combined)) {
    return (
      <TransactionAppShell title={title}>
        <SupabaseStatusPanel result={combined} />
      </TransactionAppShell>
    );
  }

  const last_updated = latest_transaction_date(combined.rows);

  return (
    <TransactionAppShell title={title} last_updated={last_updated}>
      <StatementViewSuspense>
        <TransactionStatementView
          data={combined}
          view_base_path={mbb_2_gold_combined_href()}
        />
      </StatementViewSuspense>
    </TransactionAppShell>
  );
}