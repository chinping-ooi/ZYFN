import { TransactionAppShell as AppShell } from "@/components/transaction_app_shell";
import { TransactionAccountPage } from "@/components/transaction_account_page";
import { MBB_VISA_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default async function MbbVisa1697Page() {
  return (
    <AppShell
      title="MBB Visa 1697"
      description="Credit card statement · Supabase"
      footer_note="public.zyfn_transactions · account_id 8 · MYR"
    >
      <TransactionAccountPage config={MBB_VISA_ACCOUNT} />
    </AppShell>
  );
}