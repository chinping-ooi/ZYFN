import { AppShell } from "@/components/app_shell";
import { DashboardView } from "@/components/dashboard_view";

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      description="Personal financial overview"
    >
      <DashboardView />
    </AppShell>
  );
}