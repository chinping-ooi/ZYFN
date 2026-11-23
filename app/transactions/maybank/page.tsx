import { AppShell } from "@/components/app_shell";
import { BankStatementView } from "@/components/bank_statement_view";

export default function MaybankPage() {
  return (
    <AppShell title="Maybank" description="Bank account transactions">
      <BankStatementView account="maybank" title="Maybank" />
    </AppShell>
  );
}