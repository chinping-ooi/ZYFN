import { TransactionAppShell as AppShell } from "@/components/transaction_app_shell";
import { TransactionAccountPage } from "@/components/transaction_account_page";
import { PBE_MASTERCARD_6357_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default async function PbeMastercard6357Page() {
  return (
    <AppShell
      title="Public Bank Quantum MasterCard 6357"
      description="Credit card statement · Supabase"
      footer_note="public.zyfn_transactions · account_id 7 · MYR"
    >
      <TransactionAccountPage config={PBE_MASTERCARD_6357_ACCOUNT} />
    </AppShell>
  );
}