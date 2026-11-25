import { AppShell } from "@/components/app_shell";
import { FixedDepositPageSkeleton } from "@/components/skeletons/fixed_deposit_page_skeleton";

export default function Loading() {
  return (
    <AppShell
      title="Fixed deposits"
      description="Deposit register and maturity tracking"
      footer_note="Fixed deposits · MYR"
    >
      <FixedDepositPageSkeleton show_bank_column />
    </AppShell>
  );
}