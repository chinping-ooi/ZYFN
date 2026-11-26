"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Mbb2GoldCardBreakdownRow } from "@/lib/credit_cards/mbb_2_gold_breakdown";
import { format_rm } from "@/lib/money";

function amount_cell(
  sen: number | null,
  hint: string | null,
): ReactNode {
  if (sen === null) {
    return (
      <span className="text-[12px] text-zyfn-muted" title={hint ?? undefined}>
        —
      </span>
    );
  }
  return (
    <span className="tabular-nums" title={hint ?? undefined}>
      {format_rm(sen)}
    </span>
  );
}

export function Mbb2GoldCardBreakdownCard({
  month_label,
  rows,
}: {
  month_label: string;
  rows: Mbb2GoldCardBreakdownRow[];
}) {
  return (
    <article className="card mb-5 overflow-hidden rounded-[3px] border border-zyfn-line border-t-[3px] border-t-zyfn-navy bg-white">
      <div className="border-b border-zyfn-line px-4 py-3 md:px-[18px]">
        <h3 className="m-0 text-sm font-semibold text-[#526075]">
          Card breakdown
        </h3>
        <p className="m-0 mt-1 text-[12px] text-zyfn-muted">{month_label}</p>
      </div>
      <div className="overflow-x-auto px-4 py-3 md:px-[18px] md:py-4">
        <table className="w-full min-w-[28rem] border-collapse border border-zyfn-line text-sm">
          <thead>
            <tr className="bg-[#f8f9fb] text-left text-[12px] font-semibold text-[#526075]">
              <th className="border border-zyfn-line px-3 py-2">Card</th>
              <th className="border border-zyfn-line px-3 py-2 text-right">
                Spending
              </th>
              <th className="border border-zyfn-line px-3 py-2 text-right">
                Payments
              </th>
              <th className="border border-zyfn-line px-3 py-2 text-right">
                Outstanding balance
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="text-zyfn-ink">
                <td className="border border-zyfn-line px-3 py-2.5 font-medium">
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="text-zyfn-navy underline-offset-2 hover:underline"
                    >
                      {row.label}
                    </Link>
                  ) : (
                    row.label
                  )}
                </td>
                <td className="border border-zyfn-line px-3 py-2.5 text-right">
                  {amount_cell(row.spending_sen, null)}
                </td>
                <td className="border border-zyfn-line px-3 py-2.5 text-right">
                  {amount_cell(row.payments_sen, null)}
                </td>
                <td className="border border-zyfn-line px-3 py-2.5 text-right">
                  {amount_cell(row.outstanding_sen, row.outstanding_hint)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}