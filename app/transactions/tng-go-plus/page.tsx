import { TransactionAppShell as AppShell } from "@/components/transaction_app_shell";
import { TransactionAccountPage } from "@/components/transaction_account_page";
import { TNG_GO_PLUS_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default async function TngGoPlusPage() {
  return (
    <AppShell
      title="TNG GO+"
      description="GO+ ledger · Supabase · 4 dp amounts"
      footer_note="public.zyfn_transactions · account_id 5 · MYR"
    >
      <TransactionAccountPage config={TNG_GO_PLUS_ACCOUNT} />
    </AppShell>
  );
}