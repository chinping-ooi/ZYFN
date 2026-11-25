import { AppShell } from "@/components/app_shell";
import { DashboardView } from "@/components/dashboard_view";
import {
  MOCK_FD_SUMMARY,
  MOCK_METRICS,
  MOCK_STATEMENTS,
} from "@/lib/dashboard/mock_dashboard_data";
import { latest_transaction_date_across } from "@/lib/last_updated";

/** Mock ledger layout preview for screenshot / QA (synthetic amounts only). */
export default function DashboardPreviewPage() {
  return (
    <AppShell
      viewport_lock
      dashboard_grid
      title="Dashboard"
      last_updated={latest_transaction_date_across(MOCK_STATEMENTS)}
    >
      <DashboardView
        metrics={MOCK_METRICS}
        fd_summary={MOCK_FD_SUMMARY}
        statements={MOCK_STATEMENTS}
      />
    </AppShell>
  );
}