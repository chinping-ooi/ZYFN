"use client";

import { useMemo, useRef, type ReactNode } from "react";
import type { Chart as ChartInstance } from "chart.js";
import type { AmountScale } from "@/lib/supabase/transaction_rows";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";
import { is_spending_donut_fd_row } from "@/lib/dashboard/spending_donut_fd";
import { txn_type_breakdown } from "@/lib/transactions/type_breakdown";
import { in_out_flow_breakdown } from "@/lib/transactions/in_out_flow";
import { format_rm } from "@/lib/money";
import { format_micro_money } from "@/lib/tng/money_micro";
import {
  SummaryDoughnutPanel,
  SummaryPlaceholderDonut,
} from "@/components/summary_doughnut_panel";
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
  /** Rendered inside the Overview card below the donut and legend. */
  overview_footer?: ReactNode;
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

const TYPE_CARD_SHELL_BODY = "!px-6 md:!px-6";

const TYPE_CARD_BODY =
  "grid min-h-0 w-full grid-cols-1 gap-4 md:grid-cols-5 md:items-start md:gap-x-6 md:gap-y-4";

const TYPE_CARD_DONUT_CELL =
  "col-span-1 flex w-full min-w-0 items-start justify-center md:col-span-2";

const TYPE_CARD_LEGEND_CELL =
  "col-span-1 flex min-w-0 items-start justify-start md:col-span-3";

const TYPE_CARD_LEGEND_INNER =
  "flex w-full min-w-0 max-w-md min-h-[220px] items-center";

const OVERVIEW_DONUT_PX = 275;
const DONUT_CENTER_CAPTION = "Total";

function empty_total_label(scale: AmountScale, money_dp: 2 | 4): string {
  if (scale === "micro") {
    return `RM ${format_micro_money(0, money_dp)}`;
  }
  return format_rm(0);
}

function SummaryTypeCardEmpty({
  message,
  empty_total,
  size_px = 220,
}: {
  message: string;
  empty_total: string;
  size_px?: number;
}) {
  return (
    <div className={TYPE_CARD_BODY}>
      <div className={TYPE_CARD_DONUT_CELL}>
        <SummaryPlaceholderDonut
          center_caption={DONUT_CENTER_CAPTION}
          center_bottom={empty_total}
          size_px={size_px}
          constrain_to_column
          aria_label="Empty summary donut"
        />
      </div>
      <div className={TYPE_CARD_LEGEND_CELL}>
        <div
          className={`${TYPE_CARD_LEGEND_INNER} flex min-h-[220px] items-center justify-center`}
        >
          <p className="m-0 text-sm text-zyfn-muted">{message}</p>
        </div>
      </div>
    </div>
  );
}

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
  overview_footer,
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
    () =>
      txn_type_breakdown(statement.rows, "out", amount_scale, {
        exclude_row: is_spending_donut_fd_row,
      }),
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
  const empty_total = empty_total_label(amount_scale, money_dp);

  return (
    <section
      className={`account-summary-charts grid grid-cols-1 gap-[18px] pb-6 lg:grid-cols-2 lg:items-stretch ${className}`.trim()}
      aria-label={section_aria_label}
    >
      <div className="flex h-full min-h-0 flex-col">
        <SummaryCardShell
          title="Overview"
          className="h-full min-h-0 flex-1"
          bodyClassName="!pt-5 min-h-0 flex-1"
        >
        {flow_has_data ? (
          <div className="flex h-full min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col justify-center">
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
            </div>
            {overview_footer ? (
              <div className="mt-5 w-full shrink-0">{overview_footer}</div>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col justify-center">
              <div className="flex w-full flex-col gap-5">
                <SummaryPlaceholderDonut
                  center_caption={DONUT_CENTER_CAPTION}
                  center_bottom={empty_total}
                  size_px={OVERVIEW_DONUT_PX}
                  aria_label="Empty overview donut"
                />
                <p className="m-0 py-2 text-center text-sm text-zyfn-muted">
                  No transactions this month
                </p>
              </div>
            </div>
            {overview_footer ? (
              <div className="mt-5 w-full shrink-0">{overview_footer}</div>
            ) : null}
          </div>
        )}
        </SummaryCardShell>
      </div>

      <div className="flex h-full min-h-0 flex-col gap-[18px]">
        <SummaryCardShell
          title="Income"
          className="min-h-[280px] flex-1"
          bodyClassName={`${TYPE_CARD_SHELL_BODY} !pt-5`}
        >
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
                  constrain_to_column
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
                <div className={TYPE_CARD_LEGEND_INNER}>
                  <SummaryBreakdownLegendList
                    rows={breakdown_in.rows}
                    scale={amount_scale}
                    money_dp={money_dp}
                    chart_ref={money_in_chart_ref}
                    aria_label="Money in by transaction type"
                    layout="type_card"
                  />
                </div>
              </div>
            </div>
          ) : (
            <SummaryTypeCardEmpty
              message="No income this month"
              empty_total={empty_total}
            />
          )}
        </SummaryCardShell>

        <SummaryCardShell
          title="Spending"
          className="min-h-[280px] flex-1"
          bodyClassName={`${TYPE_CARD_SHELL_BODY} !pt-5`}
        >
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
                  constrain_to_column
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
                <div className={TYPE_CARD_LEGEND_INNER}>
                  <SummaryBreakdownLegendList
                    rows={breakdown_out.rows}
                    scale={amount_scale}
                    money_dp={money_dp}
                    chart_ref={money_out_chart_ref}
                    aria_label="Money out by transaction type"
                    layout="type_card"
                  />
                </div>
              </div>
            </div>
          ) : (
            <SummaryTypeCardEmpty
              message="No spending this month"
              empty_total={empty_total}
            />
          )}
        </SummaryCardShell>
      </div>
    </section>
  );
}