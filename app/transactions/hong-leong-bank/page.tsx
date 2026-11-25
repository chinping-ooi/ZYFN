import { TransactionAccountRoute } from "@/components/transaction_account_page";
import { HLB_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default function HongLeongPage() {
  return (
    <TransactionAccountRoute title="Hong Leong Bank" config={HLB_ACCOUNT} />
  );
}
