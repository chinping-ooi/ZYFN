"use client";

import { useMemo, useRef } from "react";
import type { Chart as ChartInstance } from "chart.js";
import type { TransactionStatementSlice } from "@/lib/supabase/transaction_statement";
import type { AmountScale } from "@/lib/supabase/transaction_rows";
import { txn_type_breakdown } from "@/lib/transactions/type_breakdown";
import { in_out_flow_breakdown } from "@/lib/transactions/in_out_flow";
import { format_rm } from "@/lib/money";
import { format_micro_money } from "@/lib/tng/money_micro";
import { SummaryDoughnutPanel } from "@/components/summary_doughnut_panel";
import {
  IN_FLOW_COLOR,
  OUT_FLOW_COLOR,
  SummaryBreakdownLegendList,
  SummaryCardShell,
  TYPE_SEGMENT_COLORS,
} from "@/components/summary_breakdown_legend";

function format_flow_total(
  scale: AmountScale,
  total_sen: number,
  total_micro: number,
  money_dp: 2 | 4,
): string {
  if (scale === "micro") {
    return `RM ${format_micro_money(total_micro, money_dp)}`;
  }
  return format_rm(total_sen);
}

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

const SIDE_BY_SIDE_DONUT =
  "mx-auto md:mx-0";

const TYPE_CARD_BODY =
  "flex min-h-0 w-full flex-1 flex-col gap-4 md:flex-row md:items-start md:gap-5";

export function AccountSummaryChartsSection({
  statement,
  total_in_label,
  total_out_label,
  amount_scale,
  money_dp,
}: {
  statement: TransactionStatementSlice;
  total_in_label: string;
  total_out_label: string;
  amount_scale: AmountScale;
  money_dp: 2 | 4;
}) {
  const flow_chart_ref = useRef<ChartInstance<"doughnut"> | null>(null);
  const money_in_chart_ref = useRef<ChartInstance<"doughnut"> | null>(null);
  const money_out_chart_ref = useRef<ChartInstance<"doughnut"> | null>(null);

  const flow = useMemo(
    () =>
      in_out_flow_breakdown(
        statement.rows,
        amount_scale,
        total_in_label,
        total_out_label,
      ),
    [statement.rows, amount_scale, total_in_label, total_out_label],
  );

  const breakdown_in = useMemo(
    () => txn_type_breakdown(statement.rows, "in", amount_scale),
    [statement.rows, amount_scale],
  );
  const breakdown_out = useMemo(
    () => txn_type_breakdown(statement.rows, "out", amount_scale),
    [statement.rows, amount_scale],
  );

  const flow_values = flow.slices.map((row) =>
    amount_scale === "micro" ? row.amount_micro : row.amount_sen,
  );
  const in_values = breakdown_in.rows.map((row) =>
    amount_scale === "micro" ? row.amount_micro : row.amount_sen,
  );
  const out_values = breakdown_out.rows.map((row) =>
    amount_scale === "micro" ? row.amount_micro : row.amount_sen,
  );

  const net_label = format_net(
    amount_scale,
    flow.net_sen,
    flow.net_micro,
    money_dp,
  );
  const money_in_total = format_flow_total(
    amount_scale,
    statement.total_in_sen,
    statement.total_in_micro,
    money_dp,
  );
  const money_out_total = format_flow_total(
    amount_scale,
    statement.total_out_sen,
    statement.total_out_micro,
    money_dp,
  );

  const flow_has_data = flow_values.some((v) => v > 0);
  const in_has_data = in_values.some((v) => v > 0);
  const out_has_data = out_values.some((v) => v > 0);

  return (
    <section
      className="account-summary-charts grid grid-cols-1 gap-[18px] pb-6 lg:grid-cols-2 lg:items-stretch"
      aria-label="Account summary charts"
    >
      <SummaryCardShell title="Total in vs Total out" className="h-full">
        {flow_has_data ? (
          <div className="flex min-h-0 flex-1 flex-col gap-5">
            <SummaryDoughnutPanel
              chart_ref={flow_chart_ref}
              values={flow_values}
              colors={[IN_FLOW_COLOR, OUT_FLOW_COLOR]}
              center_top="Net"
              center_bottom={net_label}
              aria_label={`In vs out donut, net ${net_label}`}
              tooltip_callback={(index) => {
                const row = flow.slices[index];
                if (!row) return "";
                const amt =
                  amount_scale === "micro"
                    ? `RM ${format_micro_money(row.amount_micro, money_dp)}`
                    : format_rm(row.amount_sen);
                return `${row.label}: ${amt} (${row.pct.toFixed(1)}%) · ${row.count} txn`;
              }}
            />
            <SummaryBreakdownLegendList
              rows={flow.slices}
              scale={amount_scale}
              money_dp={money_dp}
              chart_ref={flow_chart_ref}
              aria_label="Total in vs total out legend"
              color_for_index={(i) => (i === 0 ? IN_FLOW_COLOR : OUT_FLOW_COLOR)}
              bar_color_for_index={(i) =>
                i === 0 ? IN_FLOW_COLOR : OUT_FLOW_COLOR
              }
            />
          </div>
        ) : (
          <p className="text-center text-sm text-zyfn-muted">
            No money in or out in this period.
          </p>
        )}
      </SummaryCardShell>

      <div className="flex h-full flex-col gap-[18px]">
        <SummaryCardShell title="Money in" className="min-h-[280px] flex-1">
          {in_has_data ? (
            <div className={TYPE_CARD_BODY}>
              <SummaryDoughnutPanel
                className={SIDE_BY_SIDE_DONUT}
                chart_ref={money_in_chart_ref}
                values={in_values}
                colors={breakdown_in.rows.map(
                  (_, i) => TYPE_SEGMENT_COLORS[i % TYPE_SEGMENT_COLORS.length],
                )}
                center_top="Money in"
                center_bottom={money_in_total}
                aria_label={`Money in donut, total ${money_in_total}`}
                tooltip_callback={(index) => {
                  const row = breakdown_in.rows[index];
                  if (!row) return "";
                  const amt =
                    amount_scale === "micro"
                      ? `RM ${format_micro_money(row.amount_micro, money_dp)}`
                      : format_rm(row.amount_sen);
                  return `${row.label}: ${amt} (${row.pct.toFixed(1)}%) · ${row.count} txn`;
                }}
              />
              <SummaryBreakdownLegendList
                rows={breakdown_in.rows}
                scale={amount_scale}
                money_dp={money_dp}
                chart_ref={money_in_chart_ref}
                aria_label="Money in by transaction type"
              />
            </div>
          ) : (
            <p className="text-center text-sm text-zyfn-muted">
              No money in in this period.
            </p>
          )}
        </SummaryCardShell>

        <SummaryCardShell title="Money out" className="min-h-[280px] flex-1">
          {out_has_data ? (
            <div className={TYPE_CARD_BODY}>
              <SummaryDoughnutPanel
                className={SIDE_BY_SIDE_DONUT}
                chart_ref={money_out_chart_ref}
                values={out_values}
                colors={breakdown_out.rows.map(
                  (_, i) => TYPE_SEGMENT_COLORS[i % TYPE_SEGMENT_COLORS.length],
                )}
                center_top="Money out"
                center_bottom={money_out_total}
                aria_label={`Money out donut, total ${money_out_total}`}
                tooltip_callback={(index) => {
                  const row = breakdown_out.rows[index];
                  if (!row) return "";
                  const amt =
                    amount_scale === "micro"
                      ? `RM ${format_micro_money(row.amount_micro, money_dp)}`
                      : format_rm(row.amount_sen);
                  return `${row.label}: ${amt} (${row.pct.toFixed(1)}%) · ${row.count} txn`;
                }}
              />
              <SummaryBreakdownLegendList
                rows={breakdown_out.rows}
                scale={amount_scale}
                money_dp={money_dp}
                chart_ref={money_out_chart_ref}
                aria_label="Money out by transaction type"
              />
            </div>
          ) : (
            <p className="text-center text-sm text-zyfn-muted">
              No money out in this period.
            </p>
          )}
        </SummaryCardShell>
      </div>
    </section>
  );
}