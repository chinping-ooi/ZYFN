"use client";

import {
  useMemo,
  useRef,
  type CSSProperties,
  type RefObject,
} from "react";
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

const DEFAULT_DONUT_PX = 220;
const EMPTY_RING_COLOR = "#e2e8f0";

function DonutCenterLabel({
  center_caption,
  center_bottom,
}: {
  center_caption?: string;
  center_bottom: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="flex max-w-[62%] flex-col items-center text-center leading-tight">
        {center_caption ? (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zyfn-muted">
            {center_caption}
          </span>
        ) : null}
        <span
          className={`text-lg font-medium tabular-nums text-zyfn-ink md:text-xl ${
            center_caption ? "mt-0.5" : ""
          }`}
        >
          {center_bottom}
        </span>
      </div>
    </div>
  );
}

function donutFrameStyle(
  size_px: number,
  constrain_to_column: boolean,
): CSSProperties {
  if (constrain_to_column) {
    return { width: "100%", maxWidth: size_px, aspectRatio: 1 };
  }
  return { width: size_px, height: size_px };
}

function donutFrameClass(
  constrain_to_column: boolean,
  className: string,
): string {
  const base = constrain_to_column
    ? "relative mx-auto flex aspect-square w-full items-center justify-center"
    : "relative flex shrink-0 items-center justify-center";
  return `${base} ${className}`.trim();
}

/** Grey placeholder ring for summary cards with no data (no tooltips). */
export function SummaryPlaceholderDonut({
  center_caption,
  center_bottom,
  aria_label,
  className = "mx-auto",
  size_px = DEFAULT_DONUT_PX,
  constrain_to_column = false,
}: {
  center_caption?: string;
  center_bottom: string;
  aria_label: string;
  className?: string;
  size_px?: number;
  constrain_to_column?: boolean;
}) {
  const chart_data = useMemo(
    () => ({
      labels: [""],
      datasets: [
        {
          data: [1],
          backgroundColor: [EMPTY_RING_COLOR],
          borderColor: "#ffffff",
          borderWidth: 0,
          hoverOffset: 0,
        },
      ],
    }),
    [],
  );

  const options: ChartOptions<"doughnut"> = useMemo(
    () =>
      summary_doughnut_options({
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1,
        layout: { padding: 4 },
        animation: false,
        events: [],
        plugins: {
          tooltip: { enabled: false },
        },
        cutout: "62%",
      }),
    [],
  );

  return (
    <div
      className={donutFrameClass(constrain_to_column, className)}
      style={donutFrameStyle(size_px, constrain_to_column)}
      aria-label={aria_label}
    >
      <Doughnut
        data={chart_data}
        options={options}
        plugins={[ZYFN_SUPPRESS_ARC_LABELS_PLUGIN]}
      />
      <DonutCenterLabel
        center_caption={center_caption}
        center_bottom={center_bottom}
      />
    </div>
  );
}

export function SummaryDoughnutPanel({
  values,
  colors,
  center_caption,
  center_bottom,
  aria_label,
  tooltip_callback,
  chart_ref: external_ref,
  className = "mx-auto",
  size_px = DEFAULT_DONUT_PX,
  constrain_to_column = false,
}: {
  values: number[];
  colors: string[];
  center_caption?: string;
  center_bottom: string;
  aria_label: string;
  tooltip_callback: (index: number) => string;
  chart_ref?: RefObject<ChartInstance<"doughnut"> | null>;
  className?: string;
  size_px?: number;
  constrain_to_column?: boolean;
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
      className={donutFrameClass(constrain_to_column, className)}
      style={donutFrameStyle(size_px, constrain_to_column)}
      aria-label={aria_label}
    >
      <Doughnut
        ref={chart_ref}
        data={chart_data}
        options={options}
        plugins={[ZYFN_SUPPRESS_ARC_LABELS_PLUGIN]}
      />
      <DonutCenterLabel
        center_caption={center_caption}
        center_bottom={center_bottom}
      />
    </div>
  );
}