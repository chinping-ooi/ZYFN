import { AppShell } from "@/components/app_shell";
import { DashboardLoadingContent } from "@/components/skeletons/dashboard_loading_content";

export default function Loading() {
  return (
    <AppShell viewport_lock dashboard_grid title="Dashboard">
      <DashboardLoadingContent />
    </AppShell>
  );
}