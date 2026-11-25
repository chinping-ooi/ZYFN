import { AppShell } from "@/components/app_shell";
import { DashboardView } from "@/components/dashboard_view";
import { SupabaseStatusPanel } from "@/components/supabase_status_panel";
import { load_dashboard } from "@/lib/dashboard/load_dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await load_dashboard();

  return (
    <AppShell
      title="Dashboard"
      description="Personal financial overview"
      footer_note="Supabase ledger · MYR"
    >
      {result.kind === "data" ? (
        <DashboardView metrics={result.metrics} />
      ) : (
        <SupabaseStatusPanel result={result} />
      )}
    </AppShell>
  );
}