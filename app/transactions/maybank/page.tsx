import { TransactionAppShell as AppShell } from "@/components/transaction_app_shell";
import { TransactionAccountPage } from "@/components/transaction_account_page";
import { MBB_SAVINGS_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default async function MaybankSavingsPage() {
  return (
    <AppShell
      title="Maybank Savings"
      description="Savings account · Supabase"
      footer_note="public.zyfn_transactions · account_id 3 · MYR"
    >
      <TransactionAccountPage config={MBB_SAVINGS_ACCOUNT} />
    </AppShell>
  );
}