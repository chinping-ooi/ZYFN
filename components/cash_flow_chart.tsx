"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { chart_axis_max, format_axis_tick } from "@/lib/chart_scale";
import { format_rm, type MinorAmount } from "@/lib/money";
import { CardHead } from "@/components/card_head";

ChartJS.register(
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

const COLOR_INCOME = "#a4b1c0";
const COLOR_SPENDING = "#263d5b";
const COLOR_NET = "#14b8a6";

type Props = {
  labels: string[];
  income_sen: MinorAmount[];
  spending_sen: MinorAmount[];
  period_note: string;
  monthly_income_sen: MinorAmount;
  monthly_spending_sen: MinorAmount;
  className?: string;
  fill_height?: boolean;
  cell_fill?: boolean;
};

function y_axis_min_sen(net_series_sen: number[]): number {
  const lowest = Math.min(0, ...net_series_sen);
  if (lowest >= 0) return 0;
  return -chart_axis_max([Math.abs(lowest)]);
}

const legend = (
  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 whitespace-nowrap text-[9px] text-zyfn-muted lg:gap-3 lg:text-[10px]">
    <span className="inline-flex items-center gap-1">
      <i
        className="inline-block h-1.5 w-1.5 shrink-0 bg-zyfn-slate lg:h-2 lg:w-2"
        aria-hidden
      />
      Income
    </span>
    <span className="inline-flex items-center gap-1">
      <i
        className="inline-block h-1.5 w-1.5 shrink-0 bg-zyfn-navy lg:h-2 lg:w-2"
        aria-hidden
      />
      Spending
    </span>
    <span className="inline-flex items-center gap-1">
      <i
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: COLOR_NET }}
        aria-hidden
      />
      Net cash flow
    </span>
  </div>
);

export function CashFlowChart({
  labels,
  income_sen,
  spending_sen,
  period_note,
  monthly_income_sen,
  monthly_spending_sen,
  className = "",
  fill_height = false,
  cell_fill = false,
}: Props) {
  const net_sen = monthly_income_sen - monthly_spending_sen;
  const net_label =
    net_sen === 0
      ? format_rm(0)
      : net_sen > 0
        ? `+${format_rm(net_sen)}`
        : `−${format_rm(Math.abs(net_sen))}`;

  const net_series_sen = useMemo(
    () => income_sen.map((inc, i) => inc - spending_sen[i]),
    [income_sen, spending_sen],
  );

  const y_max_sen = chart_axis_max([...income_sen, ...spending_sen]);
  const y_min_sen = y_axis_min_sen(net_series_sen);
  const y_max_major = y_max_sen / 100;
  const y_min_major = y_min_sen / 100;

  const chart_data: ChartData<"bar" | "line"> = useMemo(
    () => ({
      labels,
      datasets: [
        {
          type: "bar" as const,
          label: "Income",
          data: income_sen.map((v) => v / 100),
          backgroundColor: COLOR_INCOME,
          borderRadius: 4,
          maxBarThickness: 18,
          order: 2,
        },
        {
          type: "bar" as const,
          label: "Spending",
          data: spending_sen.map((v) => v / 100),
          backgroundColor: COLOR_SPENDING,
          borderRadius: 4,
          maxBarThickness: 18,
          order: 3,
        },
        {
          type: "line" as const,
          label: "Net cash flow",
          data: net_series_sen.map((v) => v / 100),
          borderColor: COLOR_NET,
          backgroundColor: COLOR_NET,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 4,
          pointBackgroundColor: COLOR_NET,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 1,
          order: 1,
        },
      ],
    }),
    [labels, income_sen, spending_sen, net_series_sen],
  );

  const options: ChartOptions<"bar" | "line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e3a5f",
          titleFont: { size: 11, weight: "bold" },
          bodyFont: { size: 11 },
          padding: 8,
          callbacks: {
            label(context) {
              const major = Number(context.parsed.y);
              const sen = Math.round(major * 100);
              return `${context.dataset.label}: ${format_rm(sen)}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#7a8796",
            font: { size: 10 },
          },
          grid: { display: false },
          border: { color: "#dce1e7" },
        },
        y: {
          min: y_min_major,
          max: y_max_major,
          ticks: {
            maxTicksLimit: 5,
            color: "#7a8796",
            font: { size: 9 },
            callback(tick_value) {
              const major = Number(tick_value);
              return format_axis_tick(Math.round(major * 100));
            },
          },
          grid: {
            color: "#e5e8ed",
            drawTicks: false,
          },
          border: { display: false },
        },
      },
    }),
    [y_min_major, y_max_major],
  );

  const shell_class = fill_height
    ? `card flex w-full min-w-0 flex-col overflow-hidden rounded-[3px] border border-zyfn-line bg-white ${
        cell_fill
          ? "h-full min-h-0 flex-1"
          : "h-fit shrink-0 overflow-visible"
      } ${className}`
    : `card overflow-hidden rounded-[3px] border border-zyfn-line bg-white ${className}`;

  const plot_wrap_class = cell_fill
    ? "plot relative min-h-0 min-h-[140px] max-h-[360px] flex-1"
    : fill_height
      ? "plot relative h-[clamp(120px,18vh,200px)] w-full shrink-0"
      : "plot relative h-[190px] w-full";

  const footer = (
    <div
      className="chart-summary-footer relative z-10 mt-auto flex shrink-0 flex-col gap-0.5 border-t border-zyfn-line bg-white px-2 py-1.5 text-[10px] leading-snug text-zyfn-muted min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between min-[1100px]:gap-2 lg:px-3 lg:py-2 lg:text-[11px]"
      data-testid="chart-summary-footer"
    >
      <span className="whitespace-nowrap">
        Monthly income
        <strong className="ml-1 text-[10px] font-semibold text-zyfn-ink lg:ml-1.5 lg:text-xs">
          {format_rm(monthly_income_sen)}
        </strong>
      </span>
      <span className="whitespace-nowrap">
        Net cash flow
        <strong className="ml-1 text-[10px] font-semibold text-zyfn-ink lg:ml-1.5 lg:text-xs">
          {net_label}
        </strong>
      </span>
    </div>
  );

  const plot_body = (
    <div className={plot_wrap_class}>
      <div className="absolute inset-0 pb-1">
        <Chart type="bar" data={chart_data} options={options} />
      </div>
    </div>
  );

  if (cell_fill && fill_height) {
    return (
      <section className={shell_class}>
        <CardHead
          compact
          title="Monthly cash flow"
          subtitle={period_note}
          align="center"
          className="shrink-0 flex-nowrap gap-1.5 !py-2 lg:gap-2 lg:!py-2.5"
          aside={legend}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pt-1.5 lg:px-3 lg:pt-2">
          {plot_body}
        </div>
        {footer}
      </section>
    );
  }

  return (
    <section className={shell_class}>
      <CardHead
        compact
        title="Monthly cash flow"
        subtitle={period_note}
        align="center"
        className="shrink-0 flex-nowrap gap-1.5 !py-2 lg:gap-2 lg:!py-2.5"
        aside={legend}
      />
      <div className="shrink-0 px-2 pt-1.5 lg:px-3 lg:pt-2">{plot_body}</div>
      {footer}
    </section>
  );
}