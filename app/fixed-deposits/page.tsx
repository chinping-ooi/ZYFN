import { AppShell } from "@/components/app_shell";
import { FixedDepositPageView } from "@/components/fixed_deposit_page_view";
import { load_fixed_deposits } from "@/lib/fixed_deposits/load";
import { latest_fixed_deposit_date } from "@/lib/last_updated";

export const dynamic = "force-dynamic";

export default async function FixedDepositsAllPage() {
  const load = await load_fixed_deposits();

  return (
    <AppShell
      title="Fixed deposits"
      last_updated={latest_fixed_deposit_date(load.rows)}
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