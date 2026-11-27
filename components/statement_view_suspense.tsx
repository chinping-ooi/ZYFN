import { Suspense, type ReactNode } from "react";
import { TransactionStatementSkeleton } from "@/components/skeletons/transaction_statement_skeleton";

export function StatementViewSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<TransactionStatementSkeleton />}>{children}</Suspense>;
}