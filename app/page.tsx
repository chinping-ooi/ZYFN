import { AppShell } from "@/components/app_shell";
import { DashboardView } from "@/components/dashboard_view";
import { SupabaseStatusPanel } from "@/components/supabase_status_panel";
import { load_dashboard } from "@/lib/dashboard/load_dashboard";
import { load_fixed_deposits } from "@/lib/fixed_deposits/load";
import { summarize_fixed_deposits } from "@/lib/fixed_deposits/summary";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [result, fd_load] = await Promise.all([
    load_dashboard(),
    load_fixed_deposits(),
  ]);
  const fd_summary = summarize_fixed_deposits(fd_load.rows);

  return (
    <AppShell
      viewport_lock
      title="Dashboard"
      description="Personal financial overview"
      footer_note="Supabase ledger · MYR"
    >
      {result.kind === "data" ? (
        <DashboardView
          metrics={result.metrics}
          fd_summary={fd_summary}
          statements={result.statements}
        />
      ) : (
        <SupabaseStatusPanel result={result} />
      )}
    </AppShell>
  );
}