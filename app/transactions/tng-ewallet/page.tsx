import { AppShell } from "@/components/app_shell";
import { TransactionAccountPage } from "@/components/transaction_account_page";
import { TNG_EWALLET_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default async function TngEwalletPage() {
  return (
    <AppShell
      title="TNG eWallet"
      description="eWallet ledger · Supabase"
      footer_note="public.zyfn_transactions · account_id 4 · MYR"
    >
      <TransactionAccountPage config={TNG_EWALLET_ACCOUNT} />
    </AppShell>
  );
}