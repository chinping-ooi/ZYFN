import { TransactionAppShell } from "@/components/transaction_app_shell";
import { TransactionStatementSkeleton } from "@/components/skeletons/transaction_statement_skeleton";

export default function Loading() {
  return (
    <TransactionAppShell
      title="Credit card statement"
      description="Loading transactions from Supabase"
      footer_note="public.zyfn_transactions · MYR"
    >
      <TransactionStatementSkeleton />
    </TransactionAppShell>
  );
}