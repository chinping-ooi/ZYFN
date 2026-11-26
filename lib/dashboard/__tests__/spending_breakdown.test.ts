import { describe, expect, it } from "vitest";
import { spending_breakdown_for_month, spending_total_sen } from "@/lib/dashboard/spending_breakdown";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";

function row(
  date: string,
  out_sen: number,
  sort_id: number,
  txn_type = "debit",
  opts?: {
    detail?: string;
    description?: string;
    fixed_deposit_id?: number | null;
  },
): TransactionDbRow {
  return {
    date,
    description: opts?.description ?? "Sample",
    detail: opts?.detail ?? "",
    txn_type,
    in_sen: 0,
    out_sen,
    balance_sen: 0,
    in_micro: 0,
    out_micro: 0,
    balance_micro: 0,
    sort_id,
    fixed_deposit_id: opts?.fixed_deposit_id ?? null,
  };
}

function statement(
  rows: TransactionDbRow[],
  account_ref = "PBE_SAVINGS",
  account_label = "Public Bank",
): AccountStatementFromDb {
  return {
    kind: "data",
    account_ref,
    account_label,
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
  it("excludes fd_placement and recomputes donut total and percentages", () => {
    const month = "2026-11";
    const breakdown = spending_breakdown_for_month(
      [
        statement([
          row("2026-11-05T04:00:00.000Z", 200_000, 1, "fd_placement"),
          row("2026-11-05T12:00:00.000Z", 60_478, 2, "purchase"),
          row("2026-11-06T04:00:00.000Z", 40_000, 3, "rental"),
          row("2026-11-07T04:00:00.000Z", 30_000, 4, "transfer"),
          row("2026-11-08T04:00:00.000Z", 30_000, 5, "ptptn"),
        ]),
      ],
      month,
    );

    const labels = breakdown.map((b) => b.label);
    expect(labels).not.toContain("fd_placement");
    expect(labels).toEqual(["Public Bank"]);
    expect(spending_total_sen(breakdown)).toBe(160_478);
    expect(breakdown[0]?.pct).toBe(100);
  });

  it("excludes FD category in detail when txn_type is empty", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement([
          row("2026-11-02T04:00:00.000Z", 200_000, 1, "", { detail: "fd_placement" }),
          row("2026-11-02T12:00:00.000Z", 5_000, 2, "ptptn"),
        ]),
      ],
      "2026-11",
    );
    expect(breakdown.map((b) => b.label)).toEqual(["Public Bank"]);
    expect(breakdown[0]?.amount_sen).toBe(5_000);
    expect(spending_total_sen(breakdown)).toBe(5_000);
  });

  it("excludes FD when only description carries the category", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement([
          row("2026-11-03T04:00:00.000Z", 200_000, 1, "debit", {
            description: "fd_placement",
          }),
          row("2026-11-03T12:00:00.000Z", 1_000, 2, "ptptn"),
        ]),
      ],
      "2026-11",
    );
    expect(breakdown.map((b) => b.label)).toEqual(["Public Bank"]);
    expect(spending_total_sen(breakdown)).toBe(1_000);
  });

  it("excludes rows linked by fixed_deposit_id", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement([
          row("2026-11-02T04:00:00.000Z", 99_000, 1, "debit", { fixed_deposit_id: 7 }),
          row("2026-11-02T12:00:00.000Z", 1_000, 2, "ptptn"),
        ]),
      ],
      "2026-11",
    );
    expect(breakdown[0]?.label).toBe("Public Bank");
    expect(breakdown[0]?.amount_sen).toBe(1_000);
    expect(breakdown[0]?.pct).toBe(100);
    expect(spending_total_sen(breakdown)).toBe(1_000);
  });

  it("omits FD-only spending from another account bucket", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement(
          [row("2026-11-04T12:00:00.000Z", 8_000, 1, "purchase")],
          "PBE_SAVINGS",
          "Public Bank",
        ),
        statement(
          [row("2026-11-04T04:00:00.000Z", 500_000, 2, "fd_placement")],
          "MBB_SAVINGS",
          "Maybank",
        ),
      ],
      "2026-11",
    );
    expect(breakdown.map((b) => b.label)).toEqual(["Public Bank"]);
    expect(spending_total_sen(breakdown)).toBe(8_000);
  });

  it("does not emit fixed deposit account buckets", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement(
          [row("2026-11-05T12:00:00.000Z", 2_000, 1, "debit")],
          "HLB_FD",
          "HLB Fixed Deposit",
        ),
      ],
      "2026-11",
    );
    expect(breakdown).toHaveLength(0);
    expect(spending_total_sen(breakdown)).toBe(0);
  });
});