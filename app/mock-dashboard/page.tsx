import { AppShell } from "@/components/app_shell";
import { DashboardView } from "@/components/dashboard_view";
import {
  MOCK_FD_SUMMARY,
  MOCK_METRICS,
  MOCK_STATEMENTS,
} from "@/lib/dashboard/mock_dashboard_data";

export const dynamic = "force-dynamic";

/** Synthetic dashboard for layout verification (no Supabase). */
export default function MockDashboardPage() {
  return (
    <AppShell viewport_lock dashboard_grid title="Dashboard">
      <DashboardView
        metrics={MOCK_METRICS}
        fd_summary={MOCK_FD_SUMMARY}
        statements={MOCK_STATEMENTS}
      />
    </AppShell>
  );
}
