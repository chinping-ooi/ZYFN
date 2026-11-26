"use client";

import { useMemo, useRef, type RefObject } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  type ChartOptions,
  type Chart as ChartInstance,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  summary_doughnut_options,
  ZYFN_SUPPRESS_ARC_LABELS_PLUGIN,
} from "@/lib/chart/summary_doughnut";

ChartJS.register(ArcElement, Tooltip);

const DONUT_PX = 220;

export function SummaryDoughnutPanel({
  values,
  colors,
  center_top,
  center_bottom,
  aria_label,
  tooltip_callback,
  chart_ref: external_ref,
  className = "mx-auto",
}: {
  values: number[];
  colors: string[];
  center_top: string;
  center_bottom: string;
  aria_label: string;
  tooltip_callback: (index: number) => string;
  chart_ref?: RefObject<ChartInstance<"doughnut"> | null>;
  className?: string;
}) {
  const internal_ref = useRef<ChartInstance<"doughnut"> | null>(null);
  const chart_ref = external_ref ?? internal_ref;

  const chart_data = useMemo(
    () => ({
      labels: values.map(() => ""),
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: "#ffffff",
          borderWidth: 1,
          borderRadius: 3,
          spacing: 1,
          hoverOffset: 6,
        },
      ],
    }),
    [values, colors],
  );

  const options: ChartOptions<"doughnut"> = useMemo(
    () =>
      summary_doughnut_options({
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        layout: { padding: 4 },
        plugins: {
          tooltip: {
            backgroundColor: "#1e3a5f",
            titleFont: { size: 11, weight: "bold" },
            bodyFont: { size: 11 },
            padding: 8,
            callbacks: {
              title: () => "",
              label(context) {
                return tooltip_callback(context.dataIndex);
              },
            },
          },
        },
        cutout: "62%",
      }),
    [tooltip_callback],
  );

  const has_data = values.some((v) => v > 0);

  if (!has_data) {
    return (
      <p className="py-6 text-center text-sm text-zyfn-muted">No data.</p>
    );
  }

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${className}`}
      style={{ height: DONUT_PX, width: DONUT_PX }}
      aria-label={aria_label}
    >
      <Doughnut
        ref={chart_ref}
        data={chart_data}
        options={options}
        plugins={[ZYFN_SUPPRESS_ARC_LABELS_PLUGIN]}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex max-w-[62%] flex-col items-center text-center leading-tight">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zyfn-muted">
            {center_top}
          </span>
          <span className="mt-0.5 text-lg font-medium tabular-nums text-zyfn-ink md:text-xl">
            {center_bottom}
          </span>
        </div>
      </div>
    </div>
  );
}