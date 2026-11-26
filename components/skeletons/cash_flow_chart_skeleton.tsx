import { CardHead } from "@/components/card_head";
import { Skeleton } from "@/components/ui/skeleton";

export function CashFlowChartSkeleton({
  className = "",
  cell_fill = false,
  title = "Monthly cash flow",
  subtitle = "Last 6 months",
}: {
  className?: string;
  cell_fill?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const shell_class = `card flex w-full min-w-0 flex-col overflow-hidden rounded-[3px] border border-zyfn-line bg-white ${
    cell_fill ? "h-full min-h-0 flex-1" : "h-fit shrink-0"
  } ${className}`;

  const legend = (
    <div className="flex shrink-0 items-center gap-2">
      <Skeleton className="h-2.5 w-14" />
      <Skeleton className="h-2.5 w-16" />
    </div>
  );

  return (
    <section className={shell_class}>
      <CardHead
        compact
        title={title}
        subtitle={subtitle}
        align="center"
        className="shrink-0 flex-nowrap gap-1.5 !py-2 lg:gap-2 lg:!py-2.5"
        aside={legend}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pt-1.5 lg:px-3 lg:pt-2">
        <div className="plot flex min-h-[140px] max-h-[360px] flex-1 gap-1 pb-6 lg:gap-1.5 lg:pb-7">
          <div className="flex w-[2.25rem] shrink-0 flex-col justify-between pb-[18px] lg:w-[2.5rem] lg:pb-[20px]">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-2 w-8" />
            ))}
          </div>
          <div className="relative flex h-full min-h-0 min-w-0 flex-1 items-end justify-around gap-1 border-b border-zyfn-line pb-5 lg:gap-2 lg:pb-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="flex h-full min-h-0 flex-1 flex-col items-center justify-end gap-1"
              >
                <Skeleton className="h-[45%] w-[20%] max-w-4" />
                <Skeleton className="h-[60%] w-[20%] max-w-4" />
                <Skeleton className="mt-2 h-2.5 w-6" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="chart-summary-footer relative z-10 mt-auto flex shrink-0 flex-col gap-0.5 border-t border-zyfn-line bg-white px-2 py-1.5 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between lg:px-3 lg:py-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-24" />
      </div>
    </section>
  );
}