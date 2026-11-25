import { TransactionAppShell as AppShell } from "@/components/transaction_app_shell";
import { TransactionAccountPage } from "@/components/transaction_account_page";
import { MBB_AMEX_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default async function MbbAmex8060Page() {
  return (
    <AppShell
      title="MBB Amex 8060"
      description="Credit card statement · Supabase"
      footer_note="public.zyfn_transactions · account_id 9 · MYR"
    >
      <TransactionAccountPage config={MBB_AMEX_ACCOUNT} />
    </AppShell>
  );
}