import { AppShell } from "@/components/app_shell";
import { NoDataSourcePanel } from "@/components/no_data_source";

export default function MaybankPage() {
  return (
    <AppShell title="Maybank" description="Bank account transactions">
      <NoDataSourcePanel area="Maybank transactions" />
    </AppShell>
  );
}