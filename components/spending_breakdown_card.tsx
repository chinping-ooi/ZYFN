import { format_rm } from "@/lib/money";
import type { SpendingAccountRow } from "@/lib/dashboard/spending_breakdown";
import { spending_total_sen } from "@/lib/dashboard/spending_breakdown";
import { CardHead } from "@/components/card_head";

const SEGMENT_COLORS = [
  "#1e3a5f",
  "#2c5282",
  "#3d6a9c",
  "#5a7fa8",
  "#7a94b0",
  "#9aabc4",
];

function donut_gradient(rows: SpendingAccountRow[]): string {
  let cursor = 0;
  const parts: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const pct = Math.max(0, Math.min(100, rows[i].pct));
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    const end = cursor + pct;
    parts.push(`${color} ${cursor}% ${end}%`);
    cursor = end;
  }
  if (cursor < 100) {
    parts.push(`#e8ecf0 ${cursor}% 100%`);
  }
  return `conic-gradient(from -90deg, ${parts.join(", ")})`;
}

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
  content_sized?: boolean;
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
    shell_parts.push("min-h-0", "lg:flex-1", "lg:h-auto");
  } else if (content_sized) {
    shell_parts.push("h-fit");
  } else {
    shell_parts.push("h-full", "min-h-0");
  }

  const body_parts = [
    "spending-chart-body",
    "flex",
    "min-h-0",
    "flex-col",
    "gap-3",
    "px-4",
    "pb-3",
    "md:px-5",
    "md:pb-4",
  ];
  if (column_fill && content_sized) {
    body_parts.push("lg:flex-1", "lg:justify-center", "lg:overflow-y-auto");
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
          <div className={body_parts.join(" ")}>
            <div className="spending-donut-layout flex min-h-0 flex-1 flex-col items-center justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div
                className="spending-donut relative h-[112px] w-[112px] shrink-0 rounded-full lg:h-[124px] lg:w-[124px]"
                style={{ background: donut_gradient(rows) }}
                role="img"
                aria-label={`Donut chart of spending by account, total ${format_rm(total_sen)}`}
              >
                <div className="absolute inset-[30%] flex flex-col items-center justify-center rounded-full border border-[#e8ecf0] bg-white text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)]">
                  <span className="text-[9px] font-medium uppercase tracking-wide text-zyfn-muted lg:text-[10px]">
                    Total
                  </span>
                  <span className="text-[11px] font-semibold tabular-nums text-zyfn-ink lg:text-xs">
                    {format_rm(total_sen)}
                  </span>
                </div>
              </div>
              <ul
                className="legend w-full min-w-0 flex-1 space-y-1.5 sm:max-h-[min(140px,100%)] sm:overflow-y-auto"
                aria-label="Account spending legend"
              >
                {rows.map((row, i) => (
                  <li
                    key={row.id}
                    className="flex items-center gap-2 text-xs md:text-sm"
                  >
                    <span
                      className="inline-block h-2 w-2 shrink-0 rounded-[1px]"
                      style={{
                        backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                      }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate font-medium text-zyfn-ink">
                      {row.label}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-zyfn-ink">
                      {format_rm(row.amount_sen)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
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