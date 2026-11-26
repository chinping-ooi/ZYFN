"use client";

import { useMemo, useRef } from "react";
import type { Chart as ChartInstance } from "chart.js";
import type { MonthKey } from "@/lib/dashboard/metrics";
import { dashboard_overview_flow_for_month } from "@/lib/dashboard/overview_flow";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { format_rm } from "@/lib/money";
import { SummaryDoughnutPanel } from "@/components/summary_doughnut_panel";
import {
  FD_FLOW_COLOR,
  IN_FLOW_COLOR,
  OUT_FLOW_COLOR,
  SummaryBreakdownLegendList,
  SummaryCardShell,
} from "@/components/summary_breakdown_legend";

const OVERVIEW_DONUT_PX = 250;

export function DashboardOverviewCard({
  statements,
  month,
  month_label,
  className = "",
}: {
  statements: AccountStatementFromDb[];
  month: MonthKey;
  month_label: string;
  className?: string;
}) {
  const chart_ref = useRef<ChartInstance<"doughnut"> | null>(null);

  const flow = useMemo(
    () => dashboard_overview_flow_for_month(statements, month),
    [statements, month],
  );

  const values = flow.slices.map((row) => row.amount_sen);
  const flow_has_data = values.some((v) => v > 0);
  const net_label = format_rm(flow.net_sen);

  return (
    <SummaryCardShell
      title="Overview"
      className={`${className} min-h-0`}
      bodyClassName="!pt-4"
    >
      {flow_has_data ? (
        <div className="flex flex-col items-center gap-5">
          <SummaryDoughnutPanel
            chart_ref={chart_ref}
            values={values}
            colors={[IN_FLOW_COLOR, OUT_FLOW_COLOR, FD_FLOW_COLOR]}
            center_caption="Total"
            center_bottom={net_label}
            size_px={OVERVIEW_DONUT_PX}
            aria_label={`Overview donut, net ${net_label}`}
            tooltip_callback={(index) => {
              const row = flow.slices[index];
              if (!row) return "";
              return `${row.label}: ${format_rm(row.amount_sen)} (${row.pct.toFixed(1)}%) · ${row.count} txn`;
            }}
          />
          <SummaryBreakdownLegendList
            rows={flow.slices}
            scale="sen"
            money_dp={2}
            chart_ref={chart_ref}
            aria_label="Overview cash flow legend"
            color_for_index={(i) =>
              [IN_FLOW_COLOR, OUT_FLOW_COLOR, FD_FLOW_COLOR][i] ?? IN_FLOW_COLOR
            }
            bar_color_for_index={(i) =>
              [IN_FLOW_COLOR, OUT_FLOW_COLOR, FD_FLOW_COLOR][i] ?? IN_FLOW_COLOR
            }
          />
        </div>
      ) : (
        <p className="m-0 py-4 text-center text-sm text-zyfn-muted">
          No cash flow in {month_label}
        </p>
      )}
    </SummaryCardShell>
  );
}