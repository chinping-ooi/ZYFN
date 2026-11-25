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
}: {
  label: string;
  amount_sen?: MinorAmount | null;
  amount_micro?: MicroAmount | null;
  money_dp?: 2 | 4;
  meta?: ReactNode;
  hide_amount?: boolean;
  /** Statement summary uses 24px amounts per UI reference. */
  compact_amount?: boolean;
}) {
  return (
    <article className="card kpi flex h-full flex-col overflow-hidden rounded-[3px] border border-zyfn-line border-t-[3px] border-t-zyfn-navy bg-white">
      <div
        className={`flex flex-1 flex-col py-[19px] ${
          compact_amount ? "px-4 md:px-[18px]" : "px-[21px]"
        }`}
      >
        <div className="text-sm font-semibold text-[#526075]">{label}</div>
        <div
          className={`kpi-amount my-2 leading-snug font-medium whitespace-nowrap tabular-nums ${
            compact_amount ? "text-xl md:text-2xl" : "text-[30px]"
          }`}
        >
          {!hide_amount ? (
            amount_micro != null ? (
              <>
                <span className="mr-1.5 text-base text-zyfn-muted">RM</span>
                {format_micro_money(amount_micro, money_dp)}
              </>
            ) : amount_sen != null ? (
              <>
                <span
                  className={`mr-1 text-zyfn-muted ${compact_amount ? "text-sm" : "text-base"}`}
                >
                  RM
                </span>
                {format_money(amount_sen)}
              </>
            ) : null
          ) : null}
        </div>
        {meta ? (
          <div className="mt-auto min-h-[2.5rem] text-[13px] text-zyfn-muted">
            {meta}
          </div>
        ) : (
          <div className="mt-auto min-h-[2.5rem]" aria-hidden />
        )}
      </div>
    </article>
  );
}