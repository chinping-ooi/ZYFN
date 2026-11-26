import { describe, expect, it } from "vitest";
import { dashboard_overview_flow_for_month } from "@/lib/dashboard/overview_flow";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";

function row(
  date: string,
  partial: Partial<TransactionDbRow> & Pick<TransactionDbRow, "sort_id">,
): TransactionDbRow {
  return {
    date,
    description: "",
    detail: "",
    txn_type: "debit",
    in_sen: 0,
    out_sen: 0,
    balance_sen: 0,
    in_micro: 0,
    out_micro: 0,
    balance_micro: 0,
    ...partial,
  };
}

function statement(rows: TransactionDbRow[]): AccountStatementFromDb {
  return {
    kind: "data",
    account_ref: "PBE_SAVINGS",
    account_label: "Public Bank",
    account_kind: "bank",
    amount_scale: "sen",
    source: "supabase",
    rows,
    total_in_sen: 0,
    total_out_sen: 0,
    closing_sen: 0,
    total_in_micro: 0,
    total_out_micro: 0,
    closing_micro: 0,
    row_count: rows.length,
  };
}

describe("dashboard_overview_flow_for_month", () => {
  it("matches dashboard net KPI with FD in its own slice", () => {
    const month = "2026-11";
    const flow = dashboard_overview_flow_for_month(
      [
        statement([
          row("2026-11-01T04:00:00.000Z", { sort_id: 1, in_sen: 80_000, txn_type: "salary" }),
          row("2026-11-05T04:00:00.000Z", {
            sort_id: 2,
            out_sen: 200_000,
            txn_type: "fd_placement",
          }),
          row("2026-11-06T04:00:00.000Z", { sort_id: 3, out_sen: 60_478, txn_type: "purchase" }),
        ]),
      ],
      month,
    );

    expect(flow.total_fd_out_sen).toBe(200_000);
    expect(flow.total_out_sen).toBe(60_478);
    expect(flow.net_sen).toBe(80_000 - 60_478 - 200_000);
    expect(flow.slices).toHaveLength(3);
    expect(flow.slices.reduce((s, r) => s + r.pct, 0)).toBeCloseTo(100, 5);
  });
});