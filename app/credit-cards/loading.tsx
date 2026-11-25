import { TransactionAppShell } from "@/components/transaction_app_shell";
import { TransactionStatementSkeleton } from "@/components/skeletons/transaction_statement_skeleton";

export default function Loading() {
  return (
    <TransactionAppShell title="Credit card statement">
      <TransactionStatementSkeleton />
    </TransactionAppShell>
  );
}