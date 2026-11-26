import { SummaryCardShell } from "@/components/summary_breakdown_legend";
import { Skeleton } from "@/components/ui/skeleton";

const OVERVIEW_DONUT_PX = 275;
const TYPE_DONUT_PX = 220;

function SummaryLegendRowsSkeleton({
  count,
  layout = "overview",
}: {
  count: number;
  layout?: "overview" | "type_card";
}) {
  return (
    <ul
      className="m-0 w-full min-w-0 list-none divide-y divide-slate-100 p-0"
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <li
          key={i}
          className={
            layout === "type_card"
              ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-3 first:pt-0"
              : "grid grid-cols-[auto_minmax(0,1fr)_auto_3.25rem] items-center gap-x-2.5 py-3 first:pt-0"
          }
        >
          {layout === "type_card" ? (
            <Skeleton className="h-3.5 w-[min(100%,10rem)]" />
          ) : (
            <>
              <Skeleton className="size-2.5 shrink-0 rounded-full" />
              <Skeleton className="h-3.5 w-[min(100%,9rem)]" />
              <Skeleton className="h-3.5 w-16 justify-self-end" />
              <Skeleton className="h-3.5 w-8 justify-self-end" />
            </>
          )}
          {layout === "type_card" ? (
            <Skeleton className="h-3.5 w-14 justify-self-end" />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function SummaryTypeCardSkeleton({ title }: { title: string }) {
  return (
    <SummaryCardShell
      title={title}
      className="min-h-[280px] flex-1"
      bodyClassName="!px-6 md:!px-6 !pt-5"
    >
      <div className="grid min-h-0 w-full grid-cols-1 gap-4 lg:grid-cols-5 lg:items-start lg:gap-x-6 lg:gap-y-4">
        <div className="col-span-1 flex w-full min-w-0 items-start justify-center lg:col-span-2">
          <Skeleton
            className="shrink-0 rounded-full"
            style={{ width: TYPE_DONUT_PX, height: TYPE_DONUT_PX }}
          />
        </div>
        <div className="col-span-1 flex min-w-0 items-start justify-start lg:col-span-3">
          <div className="flex w-full min-w-0 max-w-md min-h-[220px] items-center">
            <SummaryLegendRowsSkeleton count={3} layout="type_card" />
          </div>
        </div>
      </div>
    </SummaryCardShell>
  );
}

export function CashFlowSummarySkeleton({
  show_overview_footer = false,
}: {
  /** MBB 2 Gold combined summary card breakdown table. */
  show_overview_footer?: boolean;
}) {
  return (
    <section
      className="account-summary-charts grid grid-cols-1 gap-[18px] pb-6 lg:grid-cols-2 lg:items-stretch"
      aria-busy="true"
      aria-label="Loading account summary"
    >
      <div className="flex h-full min-h-0 flex-col">
        <SummaryCardShell
          title="Overview"
          className="h-full min-h-0 flex-1"
          bodyClassName="!pt-5 min-h-0 flex-1"
        >
          <div className="flex h-full min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              <div className="flex w-full flex-col gap-5">
                <Skeleton
                  className="mx-auto shrink-0 rounded-full"
                  style={{ width: OVERVIEW_DONUT_PX, height: OVERVIEW_DONUT_PX }}
                />
                <SummaryLegendRowsSkeleton count={2} layout="overview" />
              </div>
            </div>
            {show_overview_footer ? (
              <div className="mt-5 w-full shrink-0 border-t border-zyfn-line pt-4">
                <Skeleton className="mb-3 h-3 w-40" />
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ) : null}
          </div>
        </SummaryCardShell>
      </div>

      <div className="flex h-full min-h-0 flex-col gap-[18px]">
        <SummaryTypeCardSkeleton title="Income" />
        <SummaryTypeCardSkeleton title="Spending" />
      </div>
    </section>
  );
}