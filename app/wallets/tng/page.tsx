import { AppShell } from "@/components/app_shell";
import { NoDataSourcePanel } from "@/components/no_data_source";

export default function TngPage() {
  return (
    <AppShell
      title="TNG"
      description="Touch ’n Go eWallet transactions"
    >
      <NoDataSourcePanel area="TNG wallet" />
    </AppShell>
  );
}