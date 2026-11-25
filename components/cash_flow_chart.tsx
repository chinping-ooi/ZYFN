"use client";

import { axis_labels, chart_axis_max } from "@/lib/chart_scale";
import { format_rm, type MinorAmount } from "@/lib/money";
import { CardHead } from "@/components/card_head";

type Props = {
  labels: string[];
  income_sen: MinorAmount[];
  spending_sen: MinorAmount[];
  period_note: string;
  monthly_income_sen: MinorAmount;
  monthly_spending_sen: MinorAmount;
  className?: string;
  /** Dashboard: clamped plot height (not viewport stretch). */
  fill_height?: boolean;
};

/** Plot area height — footer and month labels sit outside this box. */
const PLOT_CLAMP_CLASS = "h-[clamp(220px,280px,360px)]";

export function CashFlowChart({
  labels,
  income_sen,
  spending_sen,
  period_note,
  monthly_income_sen,
  monthly_spending_sen,
  className = "",
  fill_height = false,
}: Props) {
  const net_sen = monthly_income_sen - monthly_spending_sen;
  const net_label =
    net_sen === 0
      ? format_rm(0)
      : net_sen > 0
        ? `+${format_rm(net_sen)}`
        : `−${format_rm(Math.abs(net_sen))}`;
  const all_values = [...income_sen, ...spending_sen];
  const max_sen = chart_axis_max(all_values);
  const y_labels = axis_labels(max_sen);

  const aria_label = labels
    .map(
      (label, i) =>
        `${label}: income RM ${(income_sen[i] / 100).toFixed(2)}, spending RM ${(spending_sen[i] / 100).toFixed(2)}`,
    )
    .join(". ");

  const plot_class = fill_height
    ? `plot flex shrink-0 gap-2 pb-7 md:gap-3 ${PLOT_CLAMP_CLASS}`
    : "plot flex h-[190px] gap-2 pb-7 md:gap-3";

  const shell_class = fill_height
    ? `card flex h-fit w-full flex-col overflow-visible rounded-[3px] border border-zyfn-line bg-white ${className}`
    : `card overflow-hidden rounded-[3px] border border-zyfn-line bg-white ${className}`;

  const footer = (
    <div className="flex shrink-0 flex-wrap justify-between gap-2 border-t border-zyfn-line px-3 py-2.5 text-xs text-zyfn-muted md:px-5 md:py-3">
      <span>
        Monthly income
        <strong className="ml-2 text-sm font-semibold text-zyfn-ink">
          {format_rm(monthly_income_sen)}
        </strong>
      </span>
      <span>
        Net cash flow
        <strong className="ml-2 text-sm font-semibold text-zyfn-ink">
          {net_label}
        </strong>
      </span>
    </div>
  );

  const plot_body = (
    <div className={plot_class} role="img" aria-label={aria_label}>
      <div
        className="flex w-[3.25rem] shrink-0 flex-col justify-between pb-[22px] text-[10px] leading-none text-zyfn-muted md:w-[3.75rem] md:text-[11px]"
        aria-hidden
      >
        {y_labels.map((label) => (
          <span key={label} className="whitespace-nowrap">
            {label}
          </span>
        ))}
      </div>
      <div className="relative flex h-full min-h-0 min-w-0 flex-1 gap-1.5 border-b border-zyfn-line bg-[repeating-linear-gradient(to_top,transparent_0,transparent_calc(25%-1px),#e5e8ed_calc(25%-1px),#e5e8ed_25%)] md:gap-2 lg:gap-3">
        {labels.map((label, i) => {
          const income_pct = (income_sen[i] / max_sen) * 100;
          const spend_pct = (spending_sen[i] / max_sen) * 100;
          const is_current = i === labels.length - 1;
          return (
            <div
              key={`${label}-${i}`}
              className={`relative flex h-full min-h-0 flex-1 items-end justify-center gap-[5px] pb-6 ${
                is_current ? "font-semibold" : ""
              }`}
            >
              <div
                className="w-[26%] max-w-6 bg-zyfn-slate"
                style={{ height: `${income_pct}%` }}
              />
              <div
                className="w-[26%] max-w-6 bg-zyfn-navy"
                style={{ height: `${spend_pct}%` }}
              />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-zyfn-muted">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className={shell_class}>
      <CardHead
        title="Monthly cash flow"
        subtitle={period_note}
        align="center"
        aside={
          <div className="hidden shrink-0 gap-3.5 text-xs text-zyfn-muted sm:flex sm:flex-wrap">
            <span>
              <i className="mr-1.5 inline-block h-2.5 w-2.5 bg-zyfn-slate" />
              Income
            </span>
            <span>
              <i className="mr-1.5 inline-block h-2.5 w-2.5 bg-zyfn-navy" />
              Spending
            </span>
          </div>
        }
      />
      <div className="px-3 pt-3 md:px-5 md:pt-4">{plot_body}</div>
      {footer}
    </section>
  );
}