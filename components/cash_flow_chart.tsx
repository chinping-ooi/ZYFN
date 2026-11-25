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
const PLOT_CLAMP_CLASS = "h-[clamp(120px,18vh,200px)]";

const legend = (
  <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[9px] text-zyfn-muted lg:gap-3 lg:text-[10px]">
    <span className="inline-flex items-center gap-1">
      <i className="inline-block h-1.5 w-1.5 shrink-0 bg-zyfn-slate lg:h-2 lg:w-2" aria-hidden />
      Income
    </span>
    <span className="inline-flex items-center gap-1">
      <i className="inline-block h-1.5 w-1.5 shrink-0 bg-zyfn-navy lg:h-2 lg:w-2" aria-hidden />
      Spending
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
    ? `plot flex shrink-0 gap-1 pb-6 lg:gap-1.5 lg:pb-7 ${PLOT_CLAMP_CLASS}`
    : "plot flex h-[190px] gap-2 pb-7 md:gap-3";

  const shell_class = fill_height
    ? `card flex h-fit w-full min-w-0 flex-col overflow-visible rounded-[3px] border border-zyfn-line bg-white ${className}`
    : `card overflow-hidden rounded-[3px] border border-zyfn-line bg-white ${className}`;

  const footer = (
    <div className="flex shrink-0 flex-col gap-0.5 border-t border-zyfn-line px-2 py-1.5 text-[10px] leading-snug text-zyfn-muted min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between min-[1100px]:gap-2 lg:px-3 lg:py-2 lg:text-[11px]">
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
    <div className={plot_class} role="img" aria-label={aria_label}>
      <div
        className="flex w-[2.25rem] shrink-0 flex-col justify-between pb-[18px] text-[8px] leading-none text-zyfn-muted lg:w-[2.5rem] lg:pb-[20px] lg:text-[9px]"
        aria-hidden
      >
        {y_labels.map((label) => (
          <span key={label} className="whitespace-nowrap">
            {label}
          </span>
        ))}
      </div>
      <div className="relative flex h-full min-h-0 min-w-0 flex-1 gap-0.5 border-b border-zyfn-line bg-[repeating-linear-gradient(to_top,transparent_0,transparent_calc(25%-1px),#e5e8ed_calc(25%-1px),#e5e8ed_25%)] lg:gap-1">
        {labels.map((label, i) => {
          const income_pct = (income_sen[i] / max_sen) * 100;
          const spend_pct = (spending_sen[i] / max_sen) * 100;
          const is_current = i === labels.length - 1;
          return (
            <div
              key={`${label}-${i}`}
              className={`relative flex h-full min-h-0 flex-1 items-end justify-center gap-0.5 pb-5 lg:gap-1 lg:pb-6 ${
                is_current ? "font-semibold" : ""
              }`}
            >
              <div
                className="w-[20%] max-w-4 bg-zyfn-slate lg:max-w-5"
                style={{ height: `${income_pct}%` }}
              />
              <div
                className="w-[20%] max-w-4 bg-zyfn-navy lg:max-w-5"
                style={{ height: `${spend_pct}%` }}
              />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] whitespace-nowrap text-zyfn-muted lg:text-[10px]">
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
        compact
        title="Monthly cash flow"
        subtitle={period_note}
        align="center"
        className="flex-nowrap gap-1.5 !py-2 lg:gap-2 lg:!py-2.5"
        aside={legend}
      />
      <div className="px-2 pt-1.5 lg:px-3 lg:pt-2">{plot_body}</div>
      {footer}
    </section>
  );
}