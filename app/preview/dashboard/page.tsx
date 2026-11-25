import { AppShell } from "@/components/app_shell";
import { DashboardView } from "@/components/dashboard_view";
import {
  MOCK_FD_SUMMARY,
  MOCK_METRICS,
  MOCK_STATEMENTS,
} from "@/lib/dashboard/mock_dashboard_data";

/** Mock ledger layout preview for screenshot / QA (synthetic amounts only). */
export default function DashboardPreviewPage() {
  return (
    <AppShell
      viewport_lock
      title="Dashboard"
      description="Layout preview · synthetic data"
      footer_note="Preview only · not live ledger"
    >
      <DashboardView
        metrics={MOCK_METRICS}
        fd_summary={MOCK_FD_SUMMARY}
        statements={MOCK_STATEMENTS}
      />
    </AppShell>
  );
}