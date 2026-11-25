import { AppShell } from "@/components/app_shell";
import { FixedDepositPageSkeleton } from "@/components/skeletons/fixed_deposit_page_skeleton";

export default function Loading() {
  return (
    <AppShell title="Fixed deposits">
      <FixedDepositPageSkeleton show_bank_column />
    </AppShell>
  );
}