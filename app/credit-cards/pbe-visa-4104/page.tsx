import { TransactionAppShell as AppShell } from "@/components/transaction_app_shell";
import { TransactionAccountPage } from "@/components/transaction_account_page";
import { PBE_VISA_4104_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default async function PbeVisa4104Page() {
  return (
    <AppShell
      title="Public Bank Visa Gold 4104"
      description="Credit card statement · Supabase"
      footer_note="public.zyfn_transactions · account_id 6 · MYR"
    >
      <TransactionAccountPage config={PBE_VISA_4104_ACCOUNT} />
    </AppShell>
  );
}