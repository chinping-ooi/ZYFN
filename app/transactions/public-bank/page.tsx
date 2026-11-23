import { AppShell } from "@/components/app_shell";
import { BankStatementView } from "@/components/bank_statement_view";

export default function PublicBankPage() {
  return (
    <AppShell title="Public Bank" description="Bank account transactions">
      <BankStatementView account="public_bank" title="Public Bank" />
    </AppShell>
  );
}