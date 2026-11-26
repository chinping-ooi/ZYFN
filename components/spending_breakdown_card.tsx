"use client";

import { useCallback, useMemo, useRef } from "react";
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

const DONUT_PX = 250;
const MIN_SLICE_PCT = 3;

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
}: {
  rows: SpendingAccountRow[];
  total_sen: number;
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

  return (
    <div className="spending-donut-layout flex w-full flex-col items-center justify-center lg:min-h-0 lg:flex-1">
      <div className="mx-auto flex w-fit max-w-full flex-col items-center justify-center gap-8 lg:flex-row lg:items-center">
        <div
          className="spending-donut relative shrink-0"
          style={{ height: DONUT_PX, width: DONUT_PX }}
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
        <ul
          className="legend m-0 w-full max-w-full shrink-0 list-none p-0 sm:w-fit sm:max-w-[320px]"
          aria-label="Account spending legend"
        >
          {rows.map((row, i) => (
            <li
              key={row.id}
              className="grid min-h-9 grid-cols-[auto_6rem_3rem] items-center gap-4 border-b border-slate-100 text-sm last:border-b-0 hover:bg-slate-50"
              onMouseEnter={() => set_highlight(i)}
              onMouseLeave={() => set_highlight(null)}
              onFocus={() => set_highlight(i)}
              onBlur={() => set_highlight(null)}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
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
      </div>
    </div>
  );
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
    "px-4",
    "pb-3",
    "pt-1",
    "md:px-5",
    "md:pb-4",
  ];
  if (column_fill && content_sized) {
    body_parts.push("lg:flex-1", "lg:min-h-0", "lg:overflow-hidden");
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
          <div className={`${body_parts.join(" ")} flex flex-col lg:min-h-0 lg:flex-1`}>
            <SpendingDonutPanel rows={rows} total_sen={total_sen} />
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