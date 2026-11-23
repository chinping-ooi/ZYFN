import { AppShell } from "@/components/app_shell";
import { FdStatementView } from "@/components/fd_statement_view";

export default function FdMaybankPage() {
  return (
    <AppShell
      title="Maybank · Fixed deposits"
      description="Deposit register and fixed deposit activity"
    >
      <FdStatementView bank="Maybank" />
    </AppShell>
  );
}