"use client";

import { format_rm } from "@/lib/money";
import type { MinorAmount } from "@/lib/money";

const VISA_COLOR = "#1e3a5f";
const AMEX_COLOR = "#f59e0b";
const AVAILABLE_COLOR = "#e8ecf1";

export function Mbb2GoldSharedLimitBar({
  limit_sen,
  visa_used_sen,
  amex_used_sen,
}: {
  limit_sen: MinorAmount | null;
  visa_used_sen: MinorAmount;
  amex_used_sen: MinorAmount;
}) {
  const used_sen = visa_used_sen + amex_used_sen;

  if (limit_sen === null || limit_sen <= 0) {
    return (
      <article className="card mb-5 overflow-hidden rounded-[3px] border border-zyfn-line border-t-[3px] border-t-zyfn-navy bg-white">
        <div className="border-b border-zyfn-line px-4 py-3 md:px-[18px]">
          <h3 className="m-0 text-sm font-semibold text-[#526075]">
            Shared limit
          </h3>
        </div>
        <div className="px-4 py-4 md:px-[18px]">
          <p className="m-0 text-sm text-zyfn-muted">
            Limit not set — configure{" "}
            <code className="text-xs">NEXT_PUBLIC_MBB_2_GOLD_CREDIT_LIMIT_MAJOR</code>{" "}
            or{" "}
            <code className="text-xs">NEXT_PUBLIC_MBB_2_GOLD_CREDIT_LIMIT_SEN</code>{" "}
            in <code className="text-xs">.env.local</code>.
          </p>
          <p className="mb-0 mt-2 text-sm text-zyfn-ink">
            Combined outstanding:{" "}
            <span className="font-semibold tabular-nums">
              {format_rm(used_sen)}
            </span>
          </p>
        </div>
      </article>
    );
  }

  const available_sen = Math.max(0, limit_sen - used_sen);
  const visa_pct = limit_sen > 0 ? (visa_used_sen / limit_sen) * 100 : 0;
  const amex_pct = limit_sen > 0 ? (amex_used_sen / limit_sen) * 100 : 0;
  const available_pct = limit_sen > 0 ? (available_sen / limit_sen) * 100 : 0;

  return (
    <article className="card mb-5 overflow-hidden rounded-[3px] border border-zyfn-line border-t-[3px] border-t-zyfn-navy bg-white">
      <div className="border-b border-zyfn-line px-4 py-3 md:px-[18px]">
        <h3 className="m-0 text-sm font-semibold text-[#526075]">
          Shared limit
        </h3>
      </div>
      <div className="px-4 py-4 md:px-[18px]">
        <div
          className="flex h-3 w-full overflow-hidden rounded-[2px] border border-zyfn-line"
          role="img"
          aria-label={`Shared limit ${format_rm(limit_sen)}; Visa ${format_rm(visa_used_sen)}; Amex ${format_rm(amex_used_sen)}; available ${format_rm(available_sen)}`}
        >
          {visa_pct > 0 ? (
            <span
              className="h-full min-w-0"
              style={{
                width: `${visa_pct}%`,
                backgroundColor: VISA_COLOR,
              }}
              title={`Visa 1697 ${format_rm(visa_used_sen)}`}
            />
          ) : null}
          {amex_pct > 0 ? (
            <span
              className="h-full min-w-0"
              style={{
                width: `${amex_pct}%`,
                backgroundColor: AMEX_COLOR,
              }}
              title={`Amex 8060 ${format_rm(amex_used_sen)}`}
            />
          ) : null}
          {available_pct > 0 ? (
            <span
              className="h-full min-w-0 flex-1"
              style={{ backgroundColor: AVAILABLE_COLOR }}
              title={`Available ${format_rm(available_sen)}`}
            />
          ) : null}
        </div>
        <ul className="m-0 mt-3 flex flex-wrap gap-x-4 gap-y-1 list-none p-0 text-[12px] text-zyfn-muted">
          <li className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: VISA_COLOR }}
            />
            Visa used {format_rm(visa_used_sen)}
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: AMEX_COLOR }}
            />
            Amex used {format_rm(amex_used_sen)}
          </li>
          <li>Available {format_rm(available_sen)}</li>
          <li className="text-zyfn-ink">
            Limit {format_rm(limit_sen)}
          </li>
        </ul>
      </div>
    </article>
  );
}