"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { DataTableColumn } from "@/components/data_table/types";
import type { Mbb2GoldCardBreakdownRow } from "@/lib/credit_cards/mbb_2_gold_breakdown";
import { format_money } from "@/lib/format/money";

export type Mbb2GoldBreakdownDataRow = Mbb2GoldCardBreakdownRow &
  Record<string, unknown>;

function money_cell(
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
      {format_money(sen)}
    </span>
  );
}

export function mbb_2_gold_breakdown_columns(): DataTableColumn<Mbb2GoldBreakdownDataRow>[] {
  return [
    {
      key: "label",
      label: "Card",
      render_cell: (row) =>
        row.href ? (
          <Link
            href={row.href}
            className="font-medium text-zyfn-navy underline-offset-2 hover:underline"
          >
            {row.label}
          </Link>
        ) : (
          <span className="font-medium">{row.label}</span>
        ),
    },
    {
      key: "spending_sen",
      label: "Spending",
      type: "money",
    },
    {
      key: "payments_sen",
      label: "Payments",
      type: "money",
    },
    {
      key: "outstanding_sen",
      label: "Outstanding balance",
      type: "money",
      render_cell: (row) =>
        money_cell(row.outstanding_sen, row.outstanding_hint),
    },
  ];
}