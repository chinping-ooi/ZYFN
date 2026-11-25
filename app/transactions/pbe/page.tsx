import { TransactionAppShell as AppShell } from "@/components/transaction_app_shell";
import { TransactionAccountPage } from "@/components/transaction_account_page";
import { PBE_SAVINGS_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default async function PublicBankSavingsPage() {
  return (
    <AppShell
      title="Public Bank Savings"
      description="Savings account · Supabase"
      footer_note="public.zyfn_transactions · account_id 1 · MYR"
    >
      <TransactionAccountPage config={PBE_SAVINGS_ACCOUNT} />
    </AppShell>
  );
}