"use client";

import { useMemo, useRef } from "react";
import type { Chart as ChartInstance } from "chart.js";
import type { AmountScale } from "@/lib/supabase/transaction_rows";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";
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

export type CashFlowSummaryProps = {
  rows: TransactionDbRow[];
  month: string | "all";
  amount_scale: AmountScale;
  total_in_label: string;
  total_out_label: string;
  money_dp: 2 | 4;
  closing_sen?: number;
  closing_micro?: number;
  section_aria_label?: string;
  className?: string;
};

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

const TYPE_CARD_BODY =
  "grid min-h-0 w-full flex-1 grid-cols-1 gap-4 md:grid-cols-5 md:items-start md:gap-x-6 md:gap-y-4";

const TYPE_CARD_DONUT_CELL =
  "col-span-1 flex min-w-0 items-center justify-center md:col-span-2";

const TYPE_CARD_LEGEND_CELL =
  "col-span-1 min-w-0 md:col-span-3 md:pl-1 md:pr-3 md:pt-0.5";

const OVERVIEW_DONUT_PX = 275;
const DONUT_CENTER_CAPTION = "Total";

/** Three-card summary: net in vs out donut, money in / money out type breakdowns. */
export function CashFlowSummary({
  rows,
  month,
  amount_scale,
  total_in_label,
  total_out_label,
  money_dp,
  closing_sen = 0,
  closing_micro = 0,
  section_aria_label = "Cash flow summary",
  className = "",
}: CashFlowSummaryProps) {
  const flow_chart_ref = useRef<ChartInstance<"doughnut"> | null>(null);
  const money_in_chart_ref = useRef<ChartInstance<"doughnut"> | null>(null);
  const money_out_chart_ref = useRef<ChartInstance<"doughnut"> | null>(null);

  const statement = useMemo(
    () => build_transaction_statement(rows, month, closing_sen, closing_micro),
    [rows, month, closing_sen, closing_micro],
  );

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
      className={`account-summary-charts grid grid-cols-1 gap-[18px] pb-6 lg:grid-cols-2 lg:items-stretch ${className}`.trim()}
      aria-label={section_aria_label}
    >
      <div className="flex h-full min-h-0 flex-col">
        <SummaryCardShell
          title="Overview"
          className="h-full min-h-0 flex-1"
          bodyClassName="justify-center"
        >
        {flow_has_data ? (
          <div className="flex w-full flex-col gap-5">
            <SummaryDoughnutPanel
              chart_ref={flow_chart_ref}
              values={flow_values}
              colors={[IN_FLOW_COLOR, OUT_FLOW_COLOR]}
              center_caption={DONUT_CENTER_CAPTION}
              center_bottom={net_label}
              size_px={OVERVIEW_DONUT_PX}
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
          <p className="m-0 text-center text-sm text-zyfn-muted">
            No money in or out in this period.
          </p>
        )}
        </SummaryCardShell>
      </div>

      <div className="flex h-full min-h-0 flex-col gap-[18px]">
        <SummaryCardShell title="Income" className="min-h-[280px] flex-1">
          {in_has_data ? (
            <div className={TYPE_CARD_BODY}>
              <div className={TYPE_CARD_DONUT_CELL}>
                <SummaryDoughnutPanel
                  chart_ref={money_in_chart_ref}
                  values={in_values}
                  colors={breakdown_in.rows.map(
                    (_, i) => TYPE_SEGMENT_COLORS[i % TYPE_SEGMENT_COLORS.length],
                  )}
                  center_caption={DONUT_CENTER_CAPTION}
                  center_bottom={money_in_total}
                  aria_label={`Income donut, total ${money_in_total}`}
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
              </div>
              <div className={TYPE_CARD_LEGEND_CELL}>
                <SummaryBreakdownLegendList
                  rows={breakdown_in.rows}
                  scale={amount_scale}
                  money_dp={money_dp}
                  chart_ref={money_in_chart_ref}
                  aria_label="Money in by transaction type"
                />
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-zyfn-muted">
              No money in in this period.
            </p>
          )}
        </SummaryCardShell>

        <SummaryCardShell title="Spending" className="min-h-[280px] flex-1">
          {out_has_data ? (
            <div className={TYPE_CARD_BODY}>
              <div className={TYPE_CARD_DONUT_CELL}>
                <SummaryDoughnutPanel
                  chart_ref={money_out_chart_ref}
                  values={out_values}
                  colors={breakdown_out.rows.map(
                    (_, i) => TYPE_SEGMENT_COLORS[i % TYPE_SEGMENT_COLORS.length],
                  )}
                  center_caption={DONUT_CENTER_CAPTION}
                  center_bottom={money_out_total}
                  aria_label={`Spending donut, total ${money_out_total}`}
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
              </div>
              <div className={TYPE_CARD_LEGEND_CELL}>
                <SummaryBreakdownLegendList
                  rows={breakdown_out.rows}
                  scale={amount_scale}
                  money_dp={money_dp}
                  chart_ref={money_out_chart_ref}
                  aria_label="Money out by transaction type"
                />
              </div>
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