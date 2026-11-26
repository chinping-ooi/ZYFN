"use client";

import type { ReactNode, RefObject } from "react";
import type { Chart as ChartInstance } from "chart.js";
import type { AmountScale } from "@/lib/supabase/transaction_rows";
import type { TxnTypeBreakdownRow } from "@/lib/transactions/type_breakdown";
import { format_rm } from "@/lib/money";
import { format_micro_money } from "@/lib/tng/money_micro";

export const TYPE_SEGMENT_COLORS = [
  "#1e3a5f",
  "#14b8a6",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#0ea5e9",
  "#64748b",
  "#84cc16",
  "#e879f9",
  "#fb7185",
] as const;

export const IN_FLOW_COLOR = "#14b8a6";
export const OUT_FLOW_COLOR = "#f43f5e";

function format_row_amount(
  scale: AmountScale,
  row: TxnTypeBreakdownRow,
  money_dp: 2 | 4,
): string {
  if (scale === "micro") {
    return `RM ${format_micro_money(row.amount_micro, money_dp)}`;
  }
  return format_rm(row.amount_sen);
}

function highlight_slice(
  chart_ref: RefObject<ChartInstance<"doughnut"> | null>,
  index: number | null,
) {
  const chart = chart_ref.current;
  if (!chart) return;
  if (index === null) {
    chart.setActiveElements([]);
  } else {
    chart.setActiveElements([{ datasetIndex: 0, index }]);
  }
  chart.update();
}

export function SummaryBreakdownLegendList({
  rows,
  scale,
  money_dp,
  chart_ref,
  aria_label,
  color_for_index,
  bar_color_for_index,
}: {
  rows: TxnTypeBreakdownRow[];
  scale: AmountScale;
  money_dp: 2 | 4;
  chart_ref?: RefObject<ChartInstance<"doughnut"> | null>;
  aria_label: string;
  color_for_index?: (index: number) => string;
  bar_color_for_index?: (index: number) => string;
}) {
  const dot_color = color_for_index ?? ((i) => TYPE_SEGMENT_COLORS[i % TYPE_SEGMENT_COLORS.length]);
  const bar_color = bar_color_for_index ?? (() => "var(--color-zyfn-navy, #1e3a5f)");

  return (
    <ul className="m-0 min-w-0 flex-1 list-none p-0" aria-label={aria_label}>
      {rows.map((row, i) => (
        <li
          key={row.type_key}
          className="border-b border-slate-100 py-2.5 text-sm last:border-b-0"
          onMouseEnter={() =>
            chart_ref ? highlight_slice(chart_ref, i) : undefined
          }
          onMouseLeave={() =>
            chart_ref ? highlight_slice(chart_ref, null) : undefined
          }
        >
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex min-w-0 flex-1 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: dot_color(i) }}
                aria-hidden
              />
              <span
                className="truncate font-medium text-zyfn-ink"
                title={row.label}
              >
                {row.label}
              </span>
            </span>
            <span className="shrink-0 text-right font-semibold tabular-nums text-zyfn-ink">
              {format_row_amount(scale, row, money_dp)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 pl-[18px] text-[12px] text-zyfn-muted">
            <span className="w-10 shrink-0 text-right tabular-nums">
              {row.pct.toFixed(1)}%
            </span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-[#e8ecf1]">
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${Math.min(100, row.pct)}%`,
                  backgroundColor: bar_color(i),
                }}
              />
            </div>
            <span className="shrink-0 whitespace-nowrap tabular-nums">
              {row.count} txn{row.count === 1 ? "" : "s"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SummaryCardShell({
  title,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <article
      className={`card flex h-full min-h-[280px] flex-col overflow-hidden rounded-[3px] border border-zyfn-line border-t-[3px] border-t-zyfn-navy bg-white ${className}`}
    >
      <div className="shrink-0 border-b border-zyfn-line px-4 py-3 md:px-[18px]">
        <h3 className="m-0 text-sm font-semibold text-[#526075]">{title}</h3>
      </div>
      <div
        className={`flex h-full min-h-0 flex-1 flex-col px-4 py-4 md:px-[18px] md:py-5 ${bodyClassName}`.trim()}
      >
        {children}
      </div>
    </article>
  );
}