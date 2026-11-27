"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Mbb2GoldCardBreakdownRow } from "@/lib/credit_cards/mbb_2_gold_breakdown";
import { format_rm } from "@/lib/money";
import { LEDGER_TABLE_SCROLL_X } from "@/components/data_table/ledger_styles";

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

export function Mbb2GoldCardBreakdownTable({
  month_label,
  rows,
}: {
  month_label: string;
  rows: Mbb2GoldCardBreakdownRow[];
}) {
  return (
    <div
      className="w-full border-t border-zyfn-line pt-4"
      aria-labelledby="mbb-2-gold-card-breakdown-caption"
    >
      <p
        id="mbb-2-gold-card-breakdown-caption"
        className="m-0 mb-3 text-[12px] font-semibold text-[#526075]"
      >
        Card breakdown
        <span className="font-normal text-zyfn-muted"> · {month_label}</span>
      </p>
      <div className={LEDGER_TABLE_SCROLL_X}>
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
    </div>
  );
}