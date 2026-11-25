import { Skeleton } from "@/components/ui/skeleton";

export function KpiCardSkeleton({
  compact_amount = false,
  snug = false,
}: {
  compact_amount?: boolean;
  snug?: boolean;
}) {
  return (
    <article className="card kpi overflow-hidden rounded-[3px] border border-zyfn-line border-t-[3px] border-t-zyfn-navy bg-white">
      <div
        className={`py-[19px] ${
          compact_amount ? "px-4 md:px-[18px]" : "px-[21px]"
        }`}
      >
        <Skeleton className="h-4 w-[7.5rem]" />
        <Skeleton
          className={`my-2 ${
            compact_amount ? "h-7 w-[10.5rem] md:h-8" : "h-9 w-[12rem]"
          }`}
        />
        {snug ? (
          <Skeleton className="mt-1.5 h-3.5 w-[11rem]" />
        ) : (
          <Skeleton className="mt-auto min-h-[2.5rem] w-[13rem]" />
        )}
      </div>
    </article>
  );
}