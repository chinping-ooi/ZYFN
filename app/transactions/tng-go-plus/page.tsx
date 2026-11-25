import { TransactionAccountRoute } from "@/components/transaction_account_page";
import { TNG_GO_PLUS_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default function TngGoPlusPage() {
  return (
    <TransactionAccountRoute title="TNG GO+" config={TNG_GO_PLUS_ACCOUNT} />
  );
}
