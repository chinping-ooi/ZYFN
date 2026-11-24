import { AppShell } from "@/components/app_shell";
import { NoDataSourcePanel } from "@/components/no_data_source";

export default function FdMaybankPage() {
  return (
    <AppShell
      title="Maybank · Fixed deposits"
      description="Deposit register and fixed deposit activity"
    >
      <NoDataSourcePanel area="Maybank fixed deposits" />
    </AppShell>
  );
}