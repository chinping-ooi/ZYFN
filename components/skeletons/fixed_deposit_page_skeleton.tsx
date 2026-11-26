import { AccountTableCard } from "@/components/account_table_card";
import { KpiCardSkeleton } from "@/components/skeletons/kpi_card_skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function FixedDepositPageSkeleton({
  show_bank_column = false,
}: {
  show_bank_column?: boolean;
}) {
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Skeleton className="h-[21px] w-[12rem]" />
          <Skeleton className="mt-[6px] h-[13px] w-[min(100%,16rem)]" />
        </div>
        <Skeleton className="h-9 w-[min(100%,22rem)] shrink-0" />
      </div>

      <section
        className="statement-summary kpis mb-5 grid gap-[18px]"
        aria-busy="true"
        aria-label="Loading fixed deposit summary"
      >
        <KpiCardSkeleton compact_amount />
        <KpiCardSkeleton compact_amount />
        <KpiCardSkeleton compact_amount />
        <KpiCardSkeleton compact_amount />
      </section>

      <AccountTableCard
        title="Deposit register"
        loading
        skeleton_variant="fixed_deposit"
        skeleton_show_bank={show_bank_column}
      />
    </>
  );
}