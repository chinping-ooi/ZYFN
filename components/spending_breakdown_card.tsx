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
  "#254670",
  "#2c5282",
  "#3d6a9c",
  "#4a7e9e",
  "#5a7fa8",
  "#6b8fa8",
  "#7a94b0",
];

function center_amount_class(total_label: string): string {
  if (total_label.length > 16) {
    return "text-[9px] font-semibold tabular-nums text-zyfn-ink leading-none";
  }
  if (total_label.length > 13) {
    return "text-[10px] font-semibold tabular-nums text-zyfn-ink leading-tight";
  }
  return "text-[11px] font-semibold tabular-nums text-zyfn-ink md:text-xs";
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
          hoverOffset: 4,
        },
      ],
    }),
    [rows],
  );

  const options: ChartOptions<"doughnut"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 2 },
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
    <div className="spending-donut-layout flex min-h-0 w-full flex-1 flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
      <div
        className="spending-donut relative min-h-[168px] w-full min-w-0 flex-1 lg:min-h-0"
        aria-label={`Spending donut chart, total ${total_label}`}
      >
        <div className="absolute inset-0">
          <Doughnut data={chart_data} options={options} />
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex max-w-[38%] flex-col items-center justify-center px-0.5 text-center"
            style={{ maxWidth: "min(38%, 6.5rem)" }}
          >
            <span className="text-[8px] font-medium uppercase tracking-wide text-zyfn-muted md:text-[9px]">
              Total
            </span>
            <span className={`${amount_class} block max-w-full truncate`}>
              {total_label}
            </span>
          </div>
        </div>
      </div>
      <ul
        className="legend w-full max-w-full shrink-0 space-y-1.5 self-center sm:max-w-[13.5rem] lg:max-w-[12rem] lg:self-center lg:overflow-y-auto"
        aria-label="Account spending legend"
      >
        {rows.map((row, i) => (
          <li
            key={row.id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2 text-[11px] md:text-xs"
          >
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-[1px]"
              style={{
                backgroundColor: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
              }}
              aria-hidden
            />
            <span className="truncate font-medium text-zyfn-ink" title={row.label}>
              {row.label}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-zyfn-ink">
              {format_rm(row.amount_sen)}
            </span>
            <span className="w-9 shrink-0 text-right tabular-nums text-zyfn-muted">
              {row.pct.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
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