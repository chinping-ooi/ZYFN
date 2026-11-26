import { describe, expect, it } from "vitest";
import { spending_breakdown_for_month } from "@/lib/dashboard/spending_breakdown";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";

function row(
  date: string,
  out_sen: number,
  sort_id: number,
  txn_type = "debit",
  fixed_deposit_id?: number | null,
): TransactionDbRow {
  return {
    date,
    description: "Sample",
    detail: "",
    txn_type,
    in_sen: 0,
    out_sen,
    balance_sen: 0,
    in_micro: 0,
    out_micro: 0,
    balance_micro: 0,
    sort_id,
    fixed_deposit_id: fixed_deposit_id ?? null,
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
    total_out_sen: rows.reduce((s, r) => s + r.out_sen, 0),
    closing_sen: 0,
    total_in_micro: 0,
    total_out_micro: 0,
    closing_micro: 0,
    row_count: rows.length,
  };
}

describe("spending_breakdown_for_month", () => {
  it("excludes FD rows and recomputes total and percentages", () => {
    const month = "2026-11";
    const breakdown = spending_breakdown_for_month(
      [
        statement([
          row("2026-11-05T04:00:00.000Z", 50_000, 1, "fd_placement"),
          row("2026-11-05T12:00:00.000Z", 20_000, 2, "purchase"),
          row("2026-11-08T04:00:00.000Z", 30_000, 3, "rental"),
        ]),
      ],
      month,
    );

    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]?.amount_sen).toBe(50_000);
    expect(breakdown[0]?.pct).toBe(100);
  });

  it("excludes rows linked by fixed_deposit_id", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement([
          row("2026-11-02T04:00:00.000Z", 99_000, 1, "debit", 7),
          row("2026-11-02T12:00:00.000Z", 1_000, 2, "ptptn"),
        ]),
      ],
      "2026-11",
    );
    expect(breakdown[0]?.amount_sen).toBe(1_000);
    expect(breakdown[0]?.pct).toBe(100);
  });
});