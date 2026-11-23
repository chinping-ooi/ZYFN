import { AppShell } from "@/components/app_shell";
import { BankStatementView } from "@/components/bank_statement_view";

export default function TngPage() {
  return (
    <AppShell
      title="TNG"
      description="Touch ’n Go eWallet transactions"
    >
      <BankStatementView account="tng" title="TNG eWallet" />
    </AppShell>
  );
}