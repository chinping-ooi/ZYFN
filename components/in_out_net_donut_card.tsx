"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  type ChartOptions,
  type Chart as ChartInstance,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { format_rm } from "@/lib/money";
import { format_micro_money } from "@/lib/tng/money_micro";
import type { AmountScale } from "@/lib/supabase/transaction_rows";
import type { TxnTypeBreakdownRow } from "@/lib/transactions/type_breakdown";

ChartJS.register(ArcElement, Tooltip);

const IN_COLOR = "#14b8a6";
const OUT_COLOR = "#f43f5e";
const DONUT_PX = 240;

function format_net(
  scale: AmountScale,
  net_sen: number,
  net_micro: number,
  money_dp: 2 | 4,
): string {
  if (scale === "micro") {
    const sign = net_micro < 0 ? "−" : net_micro > 0 ? "+" : "";
    return `${sign}RM ${format_micro_money(Math.abs(net_micro), money_dp)}`;
  }
  const sign = net_sen < 0 ? "−" : net_sen > 0 ? "+" : "";
  return `${sign}${format_rm(Math.abs(net_sen))}`;
}

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

export function InOutNetDonutCard({
  rows,
  net_sen,
  net_micro,
  scale,
  money_dp,
}: {
  rows: TxnTypeBreakdownRow[];
  net_sen: number;
  net_micro: number;
  scale: AmountScale;
  money_dp: 2 | 4;
}) {
  const chart_ref = useRef<ChartInstance<"doughnut"> | null>(null);
  const net_label = format_net(scale, net_sen, net_micro, money_dp);

  const chart_values = useMemo(
    () =>
      rows.map((row) =>
        scale === "micro" ? row.amount_micro : row.amount_sen,
      ),
    [rows, scale],
  );

  const chart_data = useMemo(
    () => ({
      labels: rows.map((r) => r.label),
      datasets: [
        {
          data: chart_values,
          backgroundColor: [IN_COLOR, OUT_COLOR],
          borderColor: "#ffffff",
          borderWidth: 1,
          borderRadius: 3,
          spacing: 2,
          hoverOffset: 6,
        },
      ],
    }),
    [rows, chart_values],
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
              return `${row.label}: ${format_row_amount(scale, row, money_dp)} (${row.pct.toFixed(1)}%) · ${row.count} txn`;
            },
          },
        },
      },
      cutout: "62%",
    }),
    [rows, scale, money_dp],
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

  const has_flow = chart_values.some((v) => v > 0);

  return (
    <article className="card overflow-hidden rounded-[3px] border border-zyfn-line border-t-[3px] border-t-zyfn-navy bg-white">
      <div className="border-b border-zyfn-line px-4 py-3 md:px-[18px]">
        <h3 className="m-0 text-sm font-semibold text-[#526075]">
          Total in vs Total out
        </h3>
      </div>
      {!has_flow ? (
        <p className="px-4 py-8 text-center text-sm text-zyfn-muted md:px-[18px]">
          No money in or out in this period.
        </p>
      ) : (
        <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-start md:gap-6 md:px-[18px] md:py-5">
          <div
            className="relative mx-auto shrink-0 md:mx-0"
            style={{ height: DONUT_PX, width: DONUT_PX }}
            aria-label={`In vs out donut, net ${net_label}`}
          >
            <Doughnut ref={chart_ref} data={chart_data} options={options} />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex max-w-[62%] flex-col items-center text-center leading-tight">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zyfn-muted">
                  Net
                </span>
                <span className="mt-0.5 text-lg font-medium tabular-nums text-zyfn-ink md:text-xl">
                  {net_label}
                </span>
              </div>
            </div>
          </div>
          <ul
            className="m-0 min-w-0 flex-1 list-none p-0"
            aria-label="Total in vs total out legend"
          >
            {rows.map((row, i) => (
              <li
                key={row.type_key}
                className="border-b border-slate-100 py-2.5 text-sm last:border-b-0"
                onMouseEnter={() => set_highlight(i)}
                onMouseLeave={() => set_highlight(null)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: i === 0 ? IN_COLOR : OUT_COLOR,
                      }}
                      aria-hidden
                    />
                    <span className="truncate font-medium text-zyfn-ink">
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
                        backgroundColor: i === 0 ? IN_COLOR : OUT_COLOR,
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
        </div>
      )}
    </article>
  );
}