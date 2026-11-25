import { AppShell } from "@/components/app_shell";
import { SupabaseTransactionPage } from "@/components/supabase_transaction_page";
import { MBB_SAVINGS_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default async function MaybankSavingsPage() {
  return (
    <AppShell
      title="Maybank Savings"
      description="Savings account · Supabase"
      footer_note="public.zyfn_transactions · account_id 3 · MYR"
    >
      <SupabaseTransactionPage config={MBB_SAVINGS_ACCOUNT} />
    </AppShell>
  );
}