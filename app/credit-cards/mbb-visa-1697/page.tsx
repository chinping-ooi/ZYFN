import { TransactionAccountRoute } from "@/components/transaction_account_page";
import { MBB_VISA_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default function MbbVisa1697Page() {
  return (
    <TransactionAccountRoute title="MBB Visa 1697" config={MBB_VISA_ACCOUNT} />
  );
}