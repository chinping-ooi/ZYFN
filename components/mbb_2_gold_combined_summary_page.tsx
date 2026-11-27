import { StatementViewSuspense } from "@/components/statement_view_suspense";
import { Mbb2GoldCombinedSummaryView } from "@/components/mbb_2_gold_combined_summary_view";
import { TransactionAppShell } from "@/components/transaction_app_shell";
import { SupabaseStatusPanel } from "@/components/supabase_status_panel";
import { load_mbb_2_gold_combined_transactions } from "@/lib/supabase/load_mbb_2_gold_combined_transactions";
import { load_account_transactions } from "@/lib/supabase/load_account_transactions";
import { is_account_statement_data } from "@/lib/supabase/account_statement_guards";
import { supabase_configured } from "@/lib/supabase/env";
import { latest_transaction_date } from "@/lib/last_updated";
import {
  MBB_AMEX_ACCOUNT,
  MBB_VISA_ACCOUNT,
} from "@/lib/transactions/account_config";
import { account_by_prefix_and_slug } from "@/lib/accounts/registry";
import type { AccountStatementFromDb } from "@/lib/supabase/types";

const EMPTY_CARD_STATEMENT = (
  ref: string,
  label: string,
): AccountStatementFromDb => ({
  kind: "data",
  account_ref: ref,
  account_label: label,
  account_kind: "credit_card",
  amount_scale: "sen",
  source: "supabase",
  rows: [],
  total_in_sen: 0,
  total_out_sen: 0,
  closing_sen: 0,
  total_in_micro: 0,
  total_out_micro: 0,
  closing_micro: 0,
  row_count: 0,
});

export async function Mbb2GoldCombinedSummaryPage() {
  const entry = account_by_prefix_and_slug("credit-cards", "mbb-2-gold");
  const title = entry?.title ?? "MBB 2 Gold";

  if (!supabase_configured()) {
    return (
      <TransactionAppShell title={title} viewport_lock={false}>
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

  const [combined, visa_raw, amex_raw] = await Promise.all([
    load_mbb_2_gold_combined_transactions(),
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

  if (!is_account_statement_data(combined)) {
    return (
      <TransactionAppShell title={title} viewport_lock={false}>
        <SupabaseStatusPanel result={combined} />
      </TransactionAppShell>
    );
  }

  const visa = is_account_statement_data(visa_raw)
    ? visa_raw
    : EMPTY_CARD_STATEMENT(
        MBB_VISA_ACCOUNT.account_ref,
        MBB_VISA_ACCOUNT.account_label,
      );

  const amex = is_account_statement_data(amex_raw)
    ? amex_raw
    : EMPTY_CARD_STATEMENT(
        MBB_AMEX_ACCOUNT.account_ref,
        MBB_AMEX_ACCOUNT.account_label,
      );

  const last_updated = latest_transaction_date(combined.rows);

  return (
    <TransactionAppShell
      title={title}
      last_updated={last_updated}
      viewport_lock={false}
    >
      <StatementViewSuspense>
        <Mbb2GoldCombinedSummaryView combined={combined} visa={visa} amex={amex} />
      </StatementViewSuspense>
    </TransactionAppShell>
  );
}