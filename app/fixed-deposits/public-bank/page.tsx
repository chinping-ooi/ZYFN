import { AppShell } from "@/components/app_shell";
import { NoDataSourcePanel } from "@/components/no_data_source";

export default function FdPublicBankPage() {
  return (
    <AppShell
      title="Public Bank · Fixed deposits"
      description="Deposit register and fixed deposit activity"
    >
      <NoDataSourcePanel area="Public Bank fixed deposits" />
    </AppShell>
  );
}