"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
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

const DONUT_PX = 220;

function center_amount_class(total_label: string): string {
  if (total_label.length > 15) {
    return "text-[17px] font-bold tabular-nums leading-tight text-zyfn-ink";
  }
  return "text-[19px] font-bold tabular-nums leading-tight text-zyfn-ink md:text-xl";
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

  const chart_data = useMemo(
    () => ({
      labels: rows.map((r) => r.label),
      datasets: [
        {
          data: rows.map((r) => r.amount_sen / 100),
          backgroundColor: rows.map(
            (_, i) => SEGMENT_COLORS[i % SEGMENT_COLORS.length],
          ),
          borderColor: "#ffffff",
          borderWidth: 2,
          borderRadius: 4,
          spacing: 2,
          hoverOffset: 6,
        },
      ],
    }),
    [rows],
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

  return (
    <div className="spending-donut-layout flex min-h-0 w-full flex-1 flex-col items-center justify-center">
      <div className="flex w-full flex-col items-center justify-center gap-6 lg:flex-row lg:items-center lg:justify-center lg:gap-6">
        <div
          className="spending-donut relative mx-auto aspect-square w-full max-w-[220px] shrink-0"
          style={{ height: DONUT_PX, width: DONUT_PX, maxHeight: DONUT_PX }}
          aria-label={`Spending donut chart, total ${total_label}`}
        >
          <Doughnut data={chart_data} options={options} />
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
          className="legend w-full max-w-[min(100%,20rem)] shrink-0 space-y-2 lg:max-w-[15.5rem]"
          aria-label="Account spending legend"
        >
          {rows.map((row, i) => (
            <li
              key={row.id}
              className="grid grid-cols-[auto_1fr_auto_auto] items-start gap-x-3 gap-y-0.5 text-xs leading-snug md:text-[13px]"
            >
              <span
                className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
                }}
                aria-hidden
              />
              <span className="font-medium text-zyfn-ink [overflow-wrap:anywhere]">
                {row.label}
              </span>
              <span className="shrink-0 text-right font-semibold tabular-nums text-zyfn-ink">
                {format_rm(row.amount_sen)}
              </span>
              <span className="w-10 shrink-0 text-right tabular-nums text-zyfn-muted">
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
          <div className={`${body_parts.join(" ")} flex min-h-0 flex-1 flex-col`}>
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