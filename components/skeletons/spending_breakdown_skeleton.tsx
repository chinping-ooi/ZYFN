import { CardHead } from "@/components/card_head";
import { Skeleton } from "@/components/ui/skeleton";

const DONUT_PX = 250;

export function SpendingBreakdownSkeleton({
  content_sized = false,
  column_fill = false,
  className = "",
}: {
  content_sized?: boolean;
  column_fill?: boolean;
  className?: string;
}) {
  const shell_parts = [
    "card",
    "flex",
    "w-full",
    "flex-col",
    "overflow-hidden",
    "rounded-[3px]",
    "border",
    "border-zyfn-line",
    "bg-white",
  ];
  if (column_fill && content_sized) {
    shell_parts.push("min-h-0", "lg:flex-1", "lg:h-auto");
  } else if (content_sized) {
    shell_parts.push("h-fit");
  } else {
    shell_parts.push("h-full", "min-h-0");
  }

  return (
    <section className={`${shell_parts.join(" ")} ${className}`}>
      <CardHead
        compact={content_sized}
        title="Spending breakdown"
        subtitle="By account"
        align="center"
      />
      <div className="spending-chart-body flex min-h-0 flex-1 flex-col px-4 pb-3 pt-1 md:px-5 md:pb-4 lg:flex-1 lg:min-h-0">
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
          <div className="mx-auto flex w-fit max-w-full flex-col items-center justify-center gap-8 lg:flex-row lg:items-center">
            <Skeleton
              className="shrink-0 rounded-full"
              style={{ height: DONUT_PX, width: DONUT_PX }}
            />
            <ul className="m-0 w-fit max-w-[320px] shrink-0 list-none space-y-0 p-0">
              {Array.from({ length: 6 }, (_, i) => (
                <li
                  key={i}
                  className="grid min-h-9 grid-cols-[auto_6rem_3rem] items-center gap-4 border-b border-slate-100 py-1 last:border-b-0"
                >
                  <Skeleton className="h-3.5 w-[8.5rem]" />
                  <Skeleton className="ml-auto h-3.5 w-[4.5rem]" />
                  <Skeleton className="ml-auto h-3.5 w-8" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-zyfn-line bg-[#fafbfc] px-5 py-2 text-sm">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-20" />
      </div>
    </section>
  );
}