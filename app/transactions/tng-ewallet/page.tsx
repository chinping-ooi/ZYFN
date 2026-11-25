import { TransactionAccountRoute } from "@/components/transaction_account_page";
import { TNG_EWALLET_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default function TngEwalletPage() {
  return (
    <TransactionAccountRoute title="TNG eWallet" config={TNG_EWALLET_ACCOUNT} />
  );
}
