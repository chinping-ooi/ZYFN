import { AppShell } from "@/components/app_shell";
import { TransactionAccountPage } from "@/components/transaction_account_page";
import { HLB_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default async function HongLeongPage() {
  return (
    <AppShell
      title="Hong Leong Bank"
      description="Account statement · Supabase"
      footer_note="public.zyfn_transactions · HLB · MYR"
    >
      <TransactionAccountPage config={HLB_ACCOUNT} />
    </AppShell>
  );
}