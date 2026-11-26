import type { ReactNode } from "react";
import { KpiCardSkeleton } from "@/components/skeletons/kpi_card_skeleton";
import { AccountTableCard } from "@/components/account_table_card";
import { Skeleton } from "@/components/ui/skeleton";

export function TransactionStatementSkeleton({
  include_header = true,
  header_slot,
}: {
  include_header?: boolean;
  header_slot?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0">
        {header_slot ? (
          header_slot
        ) : include_header ? (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-[17px] font-semibold">Account statement</h2>
              <Skeleton className="mt-[6px] h-[13px] w-[min(100%,18rem)]" />
            </div>
            <Skeleton className="h-9 w-[10.5rem] shrink-0" />
          </div>
        ) : null}

        <section
          className="statement-summary kpis mb-5 grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4"
          aria-busy="true"
          aria-label="Loading statement summary"
        >
          <KpiCardSkeleton compact_amount />
          <KpiCardSkeleton compact_amount />
          <KpiCardSkeleton compact_amount />
          <KpiCardSkeleton compact_amount />
        </section>
      </div>

      <AccountTableCard title="Transaction activity" fill_height loading />
    </div>
  );
}