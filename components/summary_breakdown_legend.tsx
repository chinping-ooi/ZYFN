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
  className = "",
  layout = "default",
}: {
  rows: TxnTypeBreakdownRow[];
  scale: AmountScale;
  money_dp: 2 | 4;
  chart_ref?: RefObject<ChartInstance<"doughnut"> | null>;
  aria_label: string;
  color_for_index?: (index: number) => string;
  /** Accepted for API stability; single-line legend does not use bar colours. */
  bar_color_for_index?: (index: number) => string;
  className?: string;
  /** Tighter right columns for Income/Spending cards. */
  layout?: "default" | "type_card";
}) {
  const dot_color = color_for_index ?? ((i) => TYPE_SEGMENT_COLORS[i % TYPE_SEGMENT_COLORS.length]);

  return (
    <ul
      className={`m-0 min-w-0 flex-1 list-none divide-y divide-slate-100 p-0 ${className}`.trim()}
      aria-label={aria_label}
    >
      {rows.map((row, i) => (
        <li
          key={row.type_key}
          className={
            layout === "type_card"
              ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-3 text-sm first:pt-0"
              : "grid grid-cols-[auto_minmax(0,1fr)_auto_3.25rem] items-center gap-x-2.5 py-3 text-sm first:pt-0"
          }
          onMouseEnter={() =>
            chart_ref ? highlight_slice(chart_ref, i) : undefined
          }
          onMouseLeave={() =>
            chart_ref ? highlight_slice(chart_ref, null) : undefined
          }
        >
          {layout === "type_card" ? (
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: dot_color(i) }}
                aria-hidden
              />
              <span
                className="min-w-0 truncate font-medium text-zyfn-ink"
                title={row.label}
              >
                {row.label}
              </span>
            </span>
          ) : (
            <>
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: dot_color(i) }}
                aria-hidden
              />
              <span
                className="min-w-0 truncate font-medium text-zyfn-ink"
                title={row.label}
              >
                {row.label}
              </span>
            </>
          )}
          {layout === "type_card" ? (
            <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
              <span className="text-[13px] font-semibold text-zyfn-ink">
                {format_row_amount(scale, row, money_dp)}
              </span>
              <span className="w-10 text-right text-[12px] text-zyfn-muted">
                {row.pct.toFixed(1)}%
              </span>
            </span>
          ) : (
            <>
              <span className="shrink-0 text-right text-[13px] font-semibold tabular-nums text-zyfn-ink">
                {format_row_amount(scale, row, money_dp)}
              </span>
              <span className="text-right text-[12px] tabular-nums text-zyfn-muted">
                {row.pct.toFixed(1)}%
              </span>
            </>
          )}
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