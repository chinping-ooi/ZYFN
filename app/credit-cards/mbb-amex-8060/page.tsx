import { AppShell } from "@/components/app_shell";
import { SupabaseTransactionPage } from "@/components/supabase_transaction_page";
import { MBB_AMEX_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default async function MbbAmex8060Page() {
  return (
    <AppShell
      title="MBB Amex 8060"
      description="Credit card statement · Supabase"
      footer_note="public.zyfn_transactions · account_id 9 · MYR"
    >
      <SupabaseTransactionPage config={MBB_AMEX_ACCOUNT} />
    </AppShell>
  );
}