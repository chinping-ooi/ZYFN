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
      </div>

      <section
        className="mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
        aria-busy="true"
        aria-label="Loading fixed deposit summary"
      >
        <article className="rounded-[3px] border border-zyfn-line bg-white px-5 py-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-8 w-32" />
        </article>
        <article className="rounded-[3px] border border-zyfn-line bg-white px-5 py-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="mt-2 h-6 w-40" />
        </article>
        <article className="rounded-[3px] border border-zyfn-line bg-white px-5 py-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-4 w-44" />
        </article>
        <KpiCardSkeleton />
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