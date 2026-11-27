import { TransactionAppShell } from "@/components/transaction_app_shell";
import { TransactionStatementSkeleton } from "@/components/skeletons/transaction_statement_skeleton";

export function TransactionLoadingShell({
  title = "Account statement",
}: {
  title?: string;
}) {
  return (
    <TransactionAppShell title={title}>
      <TransactionStatementSkeleton />
    </TransactionAppShell>
  );
}