import type { ReactNode } from "react";
import { format_money, type MinorAmount } from "@/lib/money";
import { format_micro_money, type MicroAmount } from "@/lib/tng/money_micro";

export function KpiCard({
  label,
  amount_sen,
  amount_micro,
  money_dp = 2,
  meta,
  hide_amount,
  compact_amount,
  snug = false,
}: {
  label: string;
  amount_sen?: MinorAmount | null;
  amount_micro?: MicroAmount | null;
  money_dp?: 2 | 4;
  meta?: ReactNode;
  hide_amount?: boolean;
  /** Statement summary uses 24px amounts per UI reference. */
  compact_amount?: boolean;
  /** Dashboard KPIs: natural height, tight meta under amount. */
  snug?: boolean;
}) {
  const height_class = snug ? "" : "flex h-full flex-col";
  return (
    <article
      className={`card kpi overflow-hidden rounded-[3px] border border-zyfn-line border-t-[3px] border-t-zyfn-navy bg-white ${height_class}`}
    >
      <div
        className={`py-[19px] ${
          compact_amount ? "px-4 md:px-[18px]" : "px-[21px]"
        } ${snug ? "" : "flex flex-1 flex-col"}`}
      >
        <div className="text-sm font-semibold text-[#526075]">{label}</div>
        <div
          className={`kpi-amount my-2 leading-snug font-medium whitespace-nowrap tabular-nums ${
            compact_amount ? "text-xl md:text-2xl" : "text-[30px]"
          }`}
        >
          {hide_amount &&
          (amount_micro != null || amount_sen != null) ? (
            <>
              <span className="mr-1.5 text-base text-zyfn-muted">RM</span>
              ***
            </>
          ) : !hide_amount && amount_micro != null ? (
              <>
                <span className="mr-1.5 text-base text-zyfn-muted">RM</span>
                {format_micro_money(amount_micro, money_dp)}
              </>
            ) : !hide_amount && amount_sen != null ? (
              <>
                <span
                  className={`mr-1 text-zyfn-muted ${compact_amount ? "text-sm" : "text-base"}`}
                >
                  RM
                </span>
                {format_money(amount_sen)}
              </>
            ) : null}
        </div>
        {meta ? (
          <div
            className={
              snug
                ? "mt-1.5 text-[12px] leading-snug text-zyfn-muted md:text-[13px]"
                : "mt-auto min-h-[2.5rem] text-[13px] text-zyfn-muted"
            }
          >
            {meta}
          </div>
        ) : snug ? null : (
          <div className="mt-auto min-h-[2.5rem]" aria-hidden />
        )}
      </div>
    </article>
  );
}