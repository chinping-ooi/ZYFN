"use client";

import { useCallback, useMemo, useRef, type ReactNode } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type Chart as ChartInstance,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { format_rm } from "@/lib/money";
import type { SpendingAccountRow } from "@/lib/dashboard/spending_breakdown";
import { spending_total_sen } from "@/lib/dashboard/spending_breakdown";
import { CardHead } from "@/components/card_head";

ChartJS.register(ArcElement, Tooltip, Legend);

const SEGMENT_COLORS = [
  "#1e3a5f",
  "#14b8a6",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#0ea5e9",
];

export const SPENDING_DONUT_PX = 250;
const MIN_SLICE_PCT = 3;

export type SpendingDonutLegendRow = Pick<
  SpendingAccountRow,
  "id" | "label" | "amount_sen" | "pct"
>;

export function SpendingDonutLegendList({
  rows,
  segment_colors,
  on_row_hover,
  aria_label,
}: {
  rows: SpendingDonutLegendRow[];
  segment_colors: string[];
  on_row_hover?: (index: number | null) => void;
  aria_label: string;
}) {
  return (
    <ul
      className="legend m-0 w-fit max-w-[320px] shrink-0 list-none p-0"
      aria-label={aria_label}
    >
      {rows.map((row, i) => (
        <li
          key={row.id}
          className="grid min-h-9 grid-cols-[auto_6rem_3rem] items-center gap-4 border-b border-slate-100 text-sm last:border-b-0 hover:bg-slate-50"
          onMouseEnter={() => on_row_hover?.(i)}
          onMouseLeave={() => on_row_hover?.(null)}
          onFocus={() => on_row_hover?.(i)}
          onBlur={() => on_row_hover?.(null)}
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  segment_colors[i % segment_colors.length] ??
                  SEGMENT_COLORS[i % SEGMENT_COLORS.length],
              }}
              aria-hidden
            />
            <span
              className="truncate font-medium whitespace-nowrap text-zyfn-ink"
              title={row.label}
            >
              {row.label}
            </span>
          </span>
          <span className="text-right font-semibold tabular-nums text-zyfn-ink">
            {format_rm(row.amount_sen)}
          </span>
          <span className="text-right tabular-nums text-zyfn-muted">
            {row.pct.toFixed(1)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SpendingDonutSideBySideLayout({
  donut,
  legend,
  className = "",
}: {
  donut: ReactNode;
  legend: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`spending-donut-layout flex w-full shrink-0 flex-col items-center py-1 ${className}`.trim()}
    >
      <div className="mx-auto flex w-fit max-w-full flex-col items-center gap-8 lg:flex-row lg:items-center">
        {donut}
        {legend}
      </div>
    </div>
  );
}

export function SpendingChartCardFooter({
  label,
  amount_sen,
  content_sized = false,
}: {
  label: string;
  amount_sen: number;
  content_sized?: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-between border-t border-zyfn-line bg-[#fafbfc] px-5 text-sm ${
        content_sized ? "py-2" : "py-2.5"
      }`}
    >
      <span className="font-semibold text-zyfn-ink">{label}</span>
      <span className="font-semibold tabular-nums text-zyfn-ink">
        {format_rm(amount_sen)}
      </span>
    </div>
  );
}

/** Chart arc weights: each slice at least MIN_SLICE_PCT, renormalised to 100%. */
function chart_display_majors(rows: SpendingAccountRow[], total_sen: number): number[] {
  const floored = rows.map((r) => Math.max(r.pct, MIN_SLICE_PCT));
  const sum = floored.reduce((a, b) => a + b, 0);
  const total_major = total_sen / 100;
  return floored.map((p) => (p / sum) * total_major);
}

function center_amount_class(total_label: string): string {
  if (total_label.length > 15) {
    return "text-[20px] font-bold tabular-nums leading-tight text-zyfn-ink";
  }
  return "text-[22px] font-bold tabular-nums leading-tight text-zyfn-ink md:text-2xl";
}

function SpendingDonutPanel({
  rows,
  total_sen,
  layout_className,
}: {
  rows: SpendingAccountRow[];
  total_sen: number;
  layout_className?: string;
}) {
  const total_label = format_rm(total_sen);
  const amount_class = center_amount_class(total_label);
  const chart_ref = useRef<ChartInstance<"doughnut"> | null>(null);

  const display_majors = useMemo(
    () => chart_display_majors(rows, total_sen),
    [rows, total_sen],
  );

  const chart_data = useMemo(
    () => ({
      labels: rows.map((r) => r.label),
      datasets: [
        {
          data: display_majors,
          backgroundColor: rows.map(
            (_, i) => SEGMENT_COLORS[i % SEGMENT_COLORS.length],
          ),
          borderColor: "#ffffff",
          borderWidth: 1,
          borderRadius: 3,
          spacing: 1,
          hoverOffset: 6,
        },
      ],
    }),
    [rows, display_majors],
  );

  const options: ChartOptions<"doughnut"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      layout: { padding: 4 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e3a5f",
          titleFont: { size: 11, weight: "bold" },
          bodyFont: { size: 11 },
          padding: 8,
          callbacks: {
            label(context) {
              const row = rows[context.dataIndex];
              if (!row) return "";
              return `${row.label}: ${format_rm(row.amount_sen)} (${row.pct.toFixed(1)}%)`;
            },
          },
        },
      },
      cutout: "65%",
    }),
    [rows],
  );

  const set_highlight = useCallback((index: number | null) => {
    const chart = chart_ref.current;
    if (!chart) return;
    if (index === null) {
      chart.setActiveElements([]);
    } else {
      chart.setActiveElements([{ datasetIndex: 0, index }]);
    }
    chart.update();
  }, []);

  const set_row_hover = useCallback(
    (index: number | null) => set_highlight(index),
    [set_highlight],
  );

  return (
    <SpendingDonutSideBySideLayout
      className={layout_className}
      donut={
        <div
          className="spending-donut relative shrink-0"
          style={{ height: SPENDING_DONUT_PX, width: SPENDING_DONUT_PX }}
          aria-label={`Spending donut chart, total ${total_label}`}
        >
          <Doughnut
            ref={chart_ref}
            data={chart_data}
            options={options}
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex max-w-[58%] flex-col items-center justify-center text-center leading-tight">
              <span className="text-xs font-medium uppercase tracking-wide text-zyfn-muted">
                Total
              </span>
              <span className={`${amount_class} mt-0.5 max-w-full`}>
                {total_label}
              </span>
            </div>
          </div>
        </div>
      }
      legend={
        <SpendingDonutLegendList
          rows={rows}
          segment_colors={rows.map(
            (_, i) => SEGMENT_COLORS[i % SEGMENT_COLORS.length],
          )}
          on_row_hover={set_row_hover}
          aria_label="Account spending legend"
        />
      }
    />
  );
}

export function SpendingBreakdownCard({
  rows,
  month_label: _month_label,
  className = "",
  content_sized = false,
  column_fill = false,
}: {
  rows: SpendingAccountRow[];
  /** Reserved for callers; subtitle removed from the card header. */
  month_label: string;
  className?: string;
  content_sized?: boolean;
  column_fill?: boolean;
}) {
  void month_label;
  const total_sen = spending_total_sen(rows);

  const shell_parts = [
    "card",
    "flex",
    "w-full",
    "flex-col",
    "rounded-[3px]",
    "border",
    "border-zyfn-line",
    "bg-white",
  ];

  if (content_sized && column_fill) {
    shell_parts.push("min-h-0", "flex-1");
  } else if (content_sized) {
    shell_parts.push("h-fit", "shrink-0");
  } else if (column_fill) {
    shell_parts.push("min-h-0", "lg:flex-1", "lg:h-auto");
  } else {
    shell_parts.push("h-full", "min-h-0");
  }

  const body_parts = [
    "spending-chart-body",
    "flex",
    "flex-col",
    "px-4",
    "pb-3",
    "pt-1",
    "md:px-5",
    "md:pb-4",
  ];
  if (content_sized && column_fill) {
    body_parts.push("min-h-min", "flex-1", "justify-center");
  } else if (column_fill && !content_sized) {
    body_parts.push("shrink-0", "lg:flex-1", "lg:min-h-0", "lg:overflow-hidden");
  } else {
    body_parts.push("shrink-0");
  }

  return (
    <section className={`${shell_parts.join(" ")} ${className}`}>
      <CardHead
        compact={content_sized}
        title="Spending breakdown"
        align="center"
      />
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-zyfn-muted">
          No spending in this month after exclusions.
        </p>
      ) : (
        <>
          <div className={body_parts.join(" ")}>
            <SpendingDonutPanel
              rows={rows}
              total_sen={total_sen}
              layout_className={
                content_sized && column_fill ? "w-full shrink-0" : undefined
              }
            />
          </div>
          <SpendingChartCardFooter
            label="Total"
            amount_sen={total_sen}
            content_sized={content_sized}
          />
        </>
      )}
    </section>
  );
}