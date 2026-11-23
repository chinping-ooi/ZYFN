import { AppShell } from "@/components/app_shell";
import { FdStatementView } from "@/components/fd_statement_view";

export default function FdPublicBankPage() {
  return (
    <AppShell
      title="Public Bank · Fixed deposits"
      description="Deposit register and fixed deposit activity"
    >
      <FdStatementView bank="Public Bank" />
    </AppShell>
  );
}