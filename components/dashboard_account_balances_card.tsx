"use client";

import { Eye, EyeOff } from "lucide-react";
import { useMemo } from "react";
import type { DashboardBalanceRow } from "@/lib/dashboard/dashboard_balances";
import { sum_dashboard_balance_rows_sen } from "@/lib/dashboard/dashboard_balances";
import {
  CardSummaryFooter,
  CardSummaryFooterMetric,
} from "@/components/card_summary_footer";
import { CardHead } from "@/components/card_head";
import { MaskedAmount } from "@/components/masked_amount";
import { use_hide_amounts } from "@/lib/hooks/use_hide_amounts";

function AmountsVisibilityToggle({
  amounts_hidden,
  on_toggle,
}: {
  amounts_hidden: boolean;
  on_toggle: () => void;
}) {
  const label = amounts_hidden ? "Show amounts" : "Hide amounts";

  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center justify-center rounded-[3px] border border-zyfn-line bg-white p-1.5 text-zyfn-navy hover:bg-[#f4f6f8]"
      onClick={on_toggle}
      aria-label={label}
      aria-pressed={amounts_hidden}
      title={label}
    >
      {amounts_hidden ? (
        <EyeOff className="size-4" aria-hidden />
      ) : (
        <Eye className="size-4" aria-hidden />
      )}
    </button>
  );
}

export function DashboardAccountBalancesCard({
  rows,
  className = "",
  column_fill = false,
}: {
  rows: DashboardBalanceRow[];
  className?: string;
  /** lg dashboard: grow in column; rows list scrolls internally. */
  column_fill?: boolean;
}) {
  const { amounts_hidden, toggle_amounts_hidden } = use_hide_amounts();
  const total_sen = useMemo(
    () => sum_dashboard_balance_rows_sen(rows),
    [rows],
  );

  const shell = [
    "card",
    "flex",
    "flex-col",
    "rounded-[3px]",
    "border",
    "border-zyfn-line",
    "bg-white",
    column_fill
      ? "min-h-0 flex-1 overflow-hidden lg:h-auto lg:min-h-0"
      : "shrink-0 overflow-hidden",
    className,
  ].join(" ");

  const list_class = column_fill
    ? "balance-rows min-h-0 px-4 pb-2 md:px-5 md:pb-3 lg:flex-1 lg:overflow-y-auto"
    : "balance-rows px-4 pb-2 md:px-5 md:pb-3";

  return (
    <section className={shell}>
      <CardHead
        compact
        title="Account balances"
        subtitle="Savings, wallet, and active fixed deposits"
        align="center"
        aside={
          <AmountsVisibilityToggle
            amounts_hidden={amounts_hidden}
            on_toggle={toggle_amounts_hidden}
          />
        }
      />
      <div className={list_class}>
        {rows.map((account) => (
          <div
            key={account.id}
            className="flex items-center gap-2 border-b border-[#dce1e7] py-1 last:border-0 md:py-1.5"
          >
            <div className="min-w-0 flex-1 text-xs font-semibold leading-tight md:text-sm">
              {account.name}
            </div>
            <div className="shrink-0 text-right text-xs font-semibold tabular-nums md:text-sm">
              <MaskedAmount
                amounts_hidden={amounts_hidden}
                amount_sen={account.balance_sen}
              />
            </div>
          </div>
        ))}
      </div>
      <CardSummaryFooter testId="account-balances-footer">
        <CardSummaryFooterMetric
          label="Total assets"
          value={
            <MaskedAmount
              amounts_hidden={amounts_hidden}
              amount_sen={total_sen}
            />
          }
        />
      </CardSummaryFooter>
    </section>
  );
}