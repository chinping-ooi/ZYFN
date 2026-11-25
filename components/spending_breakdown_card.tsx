import { format_rm } from "@/lib/money";
import type { SpendingAccountRow } from "@/lib/dashboard/spending_breakdown";
import { spending_total_sen } from "@/lib/dashboard/spending_breakdown";
import { CardHead } from "@/components/card_head";

export function SpendingBreakdownCard({
  rows,
  month_label,
  className = "",
  content_sized = false,
  column_fill = false,
}: {
  rows: SpendingAccountRow[];
  month_label: string;
  className?: string;
  /** Dashboard: capped height with optional internal scroll. */
  content_sized?: boolean;
  /** Grow within dashboard left column (flex-1) while keeping Total at card bottom. */
  column_fill?: boolean;
}) {
  const total_sen = spending_total_sen(rows);

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
    shell_parts.push("min-h-0", "h-fit", "overflow-hidden", "lg:h-full", "lg:min-h-0");
  } else if (content_sized) {
    shell_parts.push("h-fit");
  } else {
    shell_parts.push("h-full", "min-h-0");
  }

  const list_parts = ["accounts", "px-5"];
  if (column_fill && content_sized) {
    list_parts.push("min-h-0", "lg:flex-1", "lg:overflow-y-auto");
  } else if (content_sized) {
    list_parts.push("overflow-visible");
  } else {
    list_parts.push("min-h-0", "flex-1", "overflow-y-auto");
  }

  return (
    <section className={`${shell_parts.join(" ")} ${className}`}>
      <CardHead
        compact={content_sized}
        title="Spending breakdown"
        subtitle={`By account · ${month_label}`}
        align="center"
      />
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-zyfn-muted">
          No spending in this month after exclusions.
        </p>
      ) : (
        <>
          <div className={list_parts.join(" ")}>
            {rows.map((row) => (
              <div
                key={row.id}
                className={`account border-b border-[#dce1e7] last:border-0 ${
                  content_sized ? "py-1.5 md:py-2" : "py-2"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`bank-name min-w-0 flex-1 font-semibold ${
                      content_sized ? "text-xs md:text-sm" : "text-sm"
                    }`}
                  >
                    {row.label}
                  </div>
                  <div
                    className={`account-value shrink-0 text-right font-semibold tabular-nums ${
                      content_sized ? "text-xs md:text-sm" : "text-sm"
                    }`}
                  >
                    {format_rm(row.amount_sen)}
                  </div>
                </div>
                <div
                  className={`${content_sized ? "mt-1.5" : "mt-2"} h-[3px] w-full overflow-hidden rounded-[2px] bg-[#e8ecf0]`}
                  role="presentation"
                  aria-hidden
                >
                  <div
                    className="h-full rounded-[2px] bg-zyfn-navy"
                    style={{ width: `${Math.min(100, row.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div
            className={`flex shrink-0 items-center justify-between border-t border-zyfn-line bg-[#fafbfc] px-5 text-sm ${
              content_sized ? "py-2" : "py-2.5"
            }`}
          >
            <span className="font-semibold text-zyfn-ink">Total</span>
            <span className="font-semibold tabular-nums text-zyfn-ink">
              {format_rm(total_sen)}
            </span>
          </div>
        </>
      )}
    </section>
  );
}