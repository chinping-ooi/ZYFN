import { TransactionAccountRoute } from "@/components/transaction_account_page";
import { MBB_AMEX_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default function MbbAmex8060Page() {
  return (
    <TransactionAccountRoute title="MBB Amex 8060" config={MBB_AMEX_ACCOUNT} />
  );
}
