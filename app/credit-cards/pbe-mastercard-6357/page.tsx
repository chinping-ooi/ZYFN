import { TransactionAccountRoute } from "@/components/transaction_account_page";
import { PBE_MASTERCARD_6357_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default function PbeMastercard6357Page() {
  return (
    <TransactionAccountRoute
      title="Public Bank Quantum MasterCard 6357"
      config={PBE_MASTERCARD_6357_ACCOUNT}
    />
  );
}
