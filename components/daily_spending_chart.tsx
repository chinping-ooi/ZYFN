"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format_rm, type MinorAmount } from "@/lib/money";
import { chart_axis_max } from "@/lib/chart_scale";
import {
  daily_spending_tooltip_date,
  daily_spending_txn_count_label,
  type DailySpendingSeries,
} from "@/lib/dashboard/daily_spending";
import type { MonthKey } from "@/lib/dashboard/metrics";
import {
  CardSummaryFooter,
  CardSummaryFooterMetric,
} from "@/components/card_summary_footer";
import { CardHead } from "@/components/card_head";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const NAVY = "#263d5b";

type Props = {
  month: MonthKey;
  month_label: string;
  series: DailySpendingSeries;
  className?: string;
};

export function DailySpendingChart({
  month,
  month_label,
  series,
  className = "",
}: Props) {
  const amounts_major = useMemo(
    () => series.spending_sen.map((s) => s / 100),
    [series.spending_sen],
  );

  const y_max_major = chart_axis_max(series.spending_sen) / 100;

  const chart_data = useMemo(
    () => ({
      labels: series.day_labels,
      datasets: [
        {
          label: "Spending",
          data: amounts_major,
          borderColor: NAVY,
          backgroundColor: NAVY,
          pointStyle: "circle" as const,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: NAVY,
          pointBorderColor: NAVY,
          borderWidth: 2,
          tension: 0.15,
        },
      ],
    }),
    [series.day_labels, amounts_major],
  );

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "nearest",
        intersect: true,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: NAVY,
          titleFont: { size: 11, weight: "bold" },
          bodyFont: { size: 11 },
          padding: 8,
          callbacks: {
            title(items) {
              const day = Number(items[0]?.label ?? "1");
              return daily_spending_tooltip_date(month, day);
            },
            label(context) {
              const major = context.parsed.y ?? 0;
              const index = context.dataIndex;
              const count = series.txn_counts[index] ?? 0;
              return [
                format_rm(Math.round(major * 100) as MinorAmount),
                daily_spending_txn_count_label(count),
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: "#dce1e7" },
          ticks: {
            color: "#64748b",
            font: { size: 9 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 15,
          },
        },
        y: {
          min: 0,
          max: y_max_major,
          grid: { color: "#e5e8ed" },
          border: { display: false },
          ticks: {
            color: "#64748b",
            font: { size: 9 },
            callback(value) {
              const n = typeof value === "number" ? value : Number(value);
              if (n >= 1000) return `RM ${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
              return `RM ${n}`;
            },
          },
        },
      },
    }),
    [month, series.txn_counts, y_max_major],
  );

  const shell_class = `card flex w-full min-w-0 shrink-0 flex-col rounded-[3px] border border-zyfn-line bg-white ${className}`.trim();

  return (
    <section className={shell_class}>
      <CardHead
        compact
        title="Daily spending"
        subtitle={month_label}
        align="center"
        className="shrink-0 flex-nowrap gap-1.5 !py-2 lg:gap-2 lg:!py-2.5"
      />
      <div className="flex flex-col px-2 pt-1.5 lg:px-3 lg:pt-2">
        <div className="plot relative min-h-[200px] w-full pb-2" style={{ height: 280 }}>
          <Line data={chart_data} options={options} aria-label={`Daily spending for ${month_label}`} />
        </div>
      </div>
      <CardSummaryFooter testId="chart-summary-footer">
        <CardSummaryFooterMetric
          label="Month total"
          value={format_rm(series.month_total_sen)}
        />
      </CardSummaryFooter>
    </section>
  );
}