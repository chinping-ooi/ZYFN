"use client";

import { axis_labels, chart_axis_max } from "@/lib/chart_scale";
import { format_rm, type MinorAmount } from "@/lib/money";

type Props = {
  labels: string[];
  income_sen: MinorAmount[];
  spending_sen: MinorAmount[];
  period_note: string;
  monthly_income_sen: MinorAmount;
  monthly_spending_sen: MinorAmount;
};

export function CashFlowChart({
  labels,
  income_sen,
  spending_sen,
  period_note,
  monthly_income_sen,
  monthly_spending_sen,
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

  return (
    <section className="overflow-hidden rounded-[3px] border border-zyfn-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zyfn-line bg-[#fafbfc] px-5 py-4">
        <div>
          <h3 className="m-0 text-[15px] font-semibold">Monthly cash flow</h3>
          <p className="m-0 mt-0.5 text-xs text-zyfn-muted">{period_note}</p>
        </div>
        <div className="flex flex-wrap gap-3.5 pt-0.5 text-xs text-zyfn-muted">
          <span>
            <i className="mr-1.5 inline-block h-2.5 w-2.5 bg-zyfn-slate" />
            Income
          </span>
          <span>
            <i className="mr-1.5 inline-block h-2.5 w-2.5 bg-zyfn-navy" />
            Spending
          </span>
        </div>
      </div>
      <div className="px-5 pt-5 pb-4">
        <div className="plot flex h-[190px] gap-3" role="img" aria-label={aria_label}>
          <div
            className="flex w-10 flex-col justify-between pb-[22px] text-[11px] text-zyfn-muted"
            aria-hidden
          >
            {y_labels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div
            className="relative mb-[22px] flex flex-1 gap-4 border-b border-zyfn-line bg-[repeating-linear-gradient(to_top,transparent_0,transparent_calc(25%-1px),#e5e8ed_calc(25%-1px),#e5e8ed_25%)]"
          >
            {labels.map((label, i) => {
              const income_pct = (income_sen[i] / max_sen) * 100;
              const spend_pct = (spending_sen[i] / max_sen) * 100;
              const is_current = i === labels.length - 1;
              return (
                <div
                  key={label}
                  className={`relative flex flex-1 items-end justify-center gap-[5px] ${
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
                  <span className="absolute -bottom-6 text-xs text-zyfn-muted">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap justify-between border-t border-zyfn-line pt-3.5 text-xs text-zyfn-muted">
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
      </div>
    </section>
  );
}