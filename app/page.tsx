import { Suspense } from "react";
import { AppShell } from "@/components/app_shell";
import { DashboardLoadingContent } from "@/components/skeletons/dashboard_loading_content";
import { DashboardView } from "@/components/dashboard_view";
import { SupabaseStatusPanel } from "@/components/supabase_status_panel";
import { load_dashboard } from "@/lib/dashboard/load_dashboard";
import { load_fixed_deposits } from "@/lib/fixed_deposits/load";
import { summarize_fixed_deposits } from "@/lib/fixed_deposits/summary";
import { latest_transaction_date_across } from "@/lib/last_updated";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [result, fd_load] = await Promise.all([
    load_dashboard(),
    load_fixed_deposits(),
  ]);
  const fd_summary = summarize_fixed_deposits(fd_load.rows);
  const last_updated =
    result.kind === "data"
      ? latest_transaction_date_across(result.statements)
      : null;

  return (
    <AppShell
      viewport_lock
      dashboard_grid
      title="Dashboard"
      last_updated={last_updated}
    >
      {result.kind === "data" ? (
        <Suspense fallback={<DashboardLoadingContent />}>
          <DashboardView
            metrics={result.metrics}
            fd_summary={fd_summary}
            statements={result.statements}
          />
        </Suspense>
      ) : (
        <SupabaseStatusPanel result={result} />
      )}
    </AppShell>
  );
}