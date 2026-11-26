"use client";

import { useCallback, useMemo, useRef } from "react";
import type { Chart as ChartInstance } from "chart.js";
import type { MonthKey } from "@/lib/dashboard/metrics";
import { dashboard_overview_flow_for_month } from "@/lib/dashboard/overview_flow";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { format_rm } from "@/lib/money";
import { CardHead } from "@/components/card_head";
import { SummaryDoughnutPanel } from "@/components/summary_doughnut_panel";
import {
  FD_FLOW_COLOR,
  IN_FLOW_COLOR,
  OUT_FLOW_COLOR,
} from "@/components/summary_breakdown_legend";
import {
  SPENDING_DONUT_PX,
  SpendingChartCardFooter,
  SpendingDonutLegendList,
  SpendingDonutSideBySideLayout,
  type SpendingDonutLegendRow,
} from "@/components/spending_breakdown_card";

const OVERVIEW_SEGMENT_COLORS = [
  IN_FLOW_COLOR,
  OUT_FLOW_COLOR,
  FD_FLOW_COLOR,
] as const;

export function DashboardOverviewCard({
  statements,
  month,
  month_label,
  className = "",
  content_sized = true,
}: {
  statements: AccountStatementFromDb[];
  month: MonthKey;
  month_label: string;
  className?: string;
  /** Match Spending breakdown dashboard card density. */
  content_sized?: boolean;
}) {
  const chart_ref = useRef<ChartInstance<"doughnut"> | null>(null);

  const flow = useMemo(
    () => dashboard_overview_flow_for_month(statements, month),
    [statements, month],
  );

  const legend_rows = useMemo<SpendingDonutLegendRow[]>(
    () =>
      flow.slices.map((row) => ({
        id: row.type_key,
        label: row.label,
        amount_sen: row.amount_sen,
        pct: row.pct,
      })),
    [flow.slices],
  );

  const values = flow.slices.map((row) => row.amount_sen);
  const flow_has_data = values.some((v) => v > 0);
  const net_label = format_rm(flow.net_sen);

  const set_row_hover = useCallback((index: number | null) => {
    const chart = chart_ref.current;
    if (!chart) return;
    if (index === null) {
      chart.setActiveElements([]);
    } else {
      chart.setActiveElements([{ datasetIndex: 0, index }]);
    }
    chart.update();
  }, []);

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
    "h-fit",
    "min-h-0",
  ];

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

  return (
    <section className={`${shell_parts.join(" ")} ${className}`}>
      <CardHead
        compact={content_sized}
        title="Overview"
        subtitle={`Total in / out / FD · ${month_label}`}
        align="center"
      />
      {!flow_has_data ? (
        <p className="px-5 py-6 text-center text-sm text-zyfn-muted">
          No cash flow in {month_label}
        </p>
      ) : (
        <>
          <div
            className={`${body_parts.join(" ")} flex min-h-0 flex-1 flex-col`}
          >
            <SpendingDonutSideBySideLayout
              donut={
                <div
                  className="spending-donut relative shrink-0"
                  style={{
                    height: SPENDING_DONUT_PX,
                    width: SPENDING_DONUT_PX,
                  }}
                >
                  <SummaryDoughnutPanel
                    chart_ref={chart_ref}
                    values={values}
                    colors={[...OVERVIEW_SEGMENT_COLORS]}
                    center_caption="Total"
                    center_bottom={net_label}
                    size_px={SPENDING_DONUT_PX}
                    className="relative h-full w-full shrink-0"
                    aria_label={`Overview donut, net ${net_label}`}
                    tooltip_callback={(index) => {
                      const row = flow.slices[index];
                      if (!row) return "";
                      return `${row.label}: ${format_rm(row.amount_sen)} (${row.pct.toFixed(1)}%) · ${row.count} txn`;
                    }}
                  />
                </div>
              }
              legend={
                <SpendingDonutLegendList
                  rows={legend_rows}
                  segment_colors={[...OVERVIEW_SEGMENT_COLORS]}
                  on_row_hover={set_row_hover}
                  aria_label="Overview cash flow legend"
                />
              }
            />
          </div>
          <SpendingChartCardFooter
            label="Net"
            amount_sen={flow.net_sen}
            content_sized={content_sized}
          />
        </>
      )}
    </section>
  );
}