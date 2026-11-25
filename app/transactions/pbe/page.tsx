import { TransactionAccountRoute } from "@/components/transaction_account_page";
import { PBE_SAVINGS_ACCOUNT } from "@/lib/transactions/account_config";

export const dynamic = "force-dynamic";

export default function PublicBankSavingsPage() {
  return (
    <TransactionAccountRoute
      title="Public Bank Savings"
      config={PBE_SAVINGS_ACCOUNT}
    />
  );
}