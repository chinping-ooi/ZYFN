import { CardHead } from "@/components/card_head";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountBalancesSkeleton({
  className = "",
  column_fill = false,
  row_count = 8,
}: {
  className?: string;
  column_fill?: boolean;
  row_count?: number;
}) {
  const shell = [
    "card",
    "flex",
    "flex-col",
    "rounded-[3px]",
    "border",
    "border-zyfn-line",
    "bg-white",
    column_fill
      ? "min-h-0 flex-1 overflow-hidden lg:h-auto lg:min-h-0"
      : "shrink-0 overflow-hidden",
    className,
  ].join(" ");

  const list_class = column_fill
    ? "balance-rows min-h-0 px-4 pb-2 md:px-5 md:pb-3 lg:flex-1 lg:overflow-y-auto"
    : "balance-rows px-4 pb-2 md:px-5 md:pb-3";

  return (
    <section className={shell}>
      <CardHead
        compact
        title="Account balances"
        subtitle="Savings, wallet, and active fixed deposits"
        align="center"
      />
      <div className={list_class}>
        {Array.from({ length: row_count }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-2 border-b border-[#dce1e7] py-1 last:border-0 md:py-1.5"
          >
            <Skeleton className="h-3.5 min-w-0 flex-1 max-w-[12rem]" />
            <Skeleton className="h-3.5 w-[5.5rem] shrink-0" />
          </div>
        ))}
      </div>
      <div className="chart-summary-footer relative z-10 mt-auto flex shrink-0 border-t border-zyfn-line bg-white px-2 py-1.5 lg:px-3 lg:py-2">
        <Skeleton className="h-3 w-36" />
      </div>
    </section>
  );
}