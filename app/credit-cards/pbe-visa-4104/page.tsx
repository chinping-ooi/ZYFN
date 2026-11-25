import { TransactionAccountRoute } from "@/components/transaction_account_page";
import { PBE_VISA_4104_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default function PbeVisa4104Page() {
  return (
    <TransactionAccountRoute
      title="Public Bank Visa Gold 4104"
      config={PBE_VISA_4104_ACCOUNT}
    />
  );
}
