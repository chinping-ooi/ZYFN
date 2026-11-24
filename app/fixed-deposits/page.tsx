import { AppShell } from "@/components/app_shell";
import { FixedDepositPageView } from "@/components/fixed_deposit_page_view";
import { load_fixed_deposits } from "@/lib/fixed_deposits/load";

export const dynamic = "force-dynamic";

export default async function FixedDepositsAllPage() {
  const load = await load_fixed_deposits();

  return (
    <AppShell
      title="Fixed deposits"
      description="All banks · Supabase zyfn_fixed_deposits"
      footer_note="Fixed deposits · MYR"
    >
      <FixedDepositPageView
        title="All fixed deposits"
        subtitle="Active and matured placements across banks"
        load={load}
        table_scope="fd-all"
        show_bank_column
      />
    </AppShell>
  );
}