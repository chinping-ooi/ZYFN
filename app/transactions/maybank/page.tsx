import { TransactionAccountRoute } from "@/components/transaction_account_page";
import { MBB_SAVINGS_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default function MaybankSavingsPage() {
  return (
    <TransactionAccountRoute
      title="Maybank Savings"
      config={MBB_SAVINGS_ACCOUNT}
    />
  );
}