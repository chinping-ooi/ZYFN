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
}: {
  label: string;
  amount_sen?: MinorAmount | null;
  amount_micro?: MicroAmount | null;
  money_dp?: 2 | 4;
  meta?: ReactNode;
  hide_amount?: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-[3px] border border-zyfn-line bg-white pt-[3px]">
      <div className="border-t-[3px] border-zyfn-navy px-5 py-[19px]">
        <div className="text-sm font-semibold text-[#526075]">{label}</div>
        <div className="my-2.5 text-[30px] leading-snug font-medium whitespace-nowrap tabular-nums">
          {!hide_amount ? (
            amount_micro != null ? (
              <>
                <span className="mr-1.5 text-base text-zyfn-muted">RM</span>
                {format_micro_money(amount_micro, money_dp)}
              </>
            ) : amount_sen != null ? (
              <>
                <span className="mr-1.5 text-base text-zyfn-muted">RM</span>
                {format_money(amount_sen)}
              </>
            ) : null
          ) : null}
        </div>
        {meta ? (
          <div className="text-[13px] text-zyfn-muted">{meta}</div>
        ) : null}
      </div>
    </article>
  );
}