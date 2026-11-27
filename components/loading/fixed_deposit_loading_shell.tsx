import { AppShell } from "@/components/app_shell";
import { FixedDepositPageSkeleton } from "@/components/skeletons/fixed_deposit_page_skeleton";

export function FixedDepositLoadingShell({
  title = "Fixed deposits",
  show_bank_column = false,
}: {
  title?: string;
  show_bank_column?: boolean;
}) {
  return (
    <AppShell title={title}>
      <FixedDepositPageSkeleton show_bank_column={show_bank_column} />
    </AppShell>
  );
}