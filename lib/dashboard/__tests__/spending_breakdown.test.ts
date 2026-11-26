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
    pair_ref?: string | null;
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
    pair_ref: opts?.pair_ref ?? null,
  };
}

function statement(
  rows: TransactionDbRow[],
  account_kind: AccountStatementFromDb["account_kind"] = "bank",
): AccountStatementFromDb {
  return {
    kind: "data",
    account_ref: "PBE_SAVINGS",
    account_label: "Public Bank",
    account_kind,
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
  it("groups by txn_type category and excludes fd_placement from total", () => {
    const month = "2026-11";
    const breakdown = spending_breakdown_for_month(
      [
        statement([
          row("2026-11-05T04:00:00.000Z", 200_000, 1, "fd_placement"),
          row("2026-11-05T12:00:00.000Z", 60_478, 2, "purchase"),
          row("2026-11-06T04:00:00.000Z", 40_000, 3, "rental"),
          row("2026-11-08T04:00:00.000Z", 30_000, 5, "ptptn"),
        ]),
      ],
      month,
    );

    const labels = breakdown.map((b) => b.label);
    expect(labels).not.toContain("fd_placement");
    expect(labels).toEqual(expect.arrayContaining(["purchase", "rental", "ptptn"]));
    expect(spending_total_sen(breakdown)).toBe(130_478);
    expect(breakdown.find((b) => b.label === "purchase")?.pct).toBeCloseTo(
      (60_478 / 130_478) * 100,
      1,
    );
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
    expect(breakdown.map((b) => b.label)).toEqual(["ptptn"]);
    expect(spending_total_sen(breakdown)).toBe(5_000);
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
    expect(breakdown[0]?.label).toBe("ptptn");
    expect(spending_total_sen(breakdown)).toBe(1_000);
  });

  it("excludes matched own-account transfers via pair_ref", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement([
          row("2026-11-07T04:00:00.000Z", 25_000, 1, "transfer", {
            pair_ref: "xfer-2026-11-07",
          }),
          row("2026-11-07T12:00:00.000Z", 4_000, 2, "telco"),
        ]),
      ],
      "2026-11",
    );
    expect(breakdown.map((b) => b.label)).toEqual(["telco"]);
    expect(spending_total_sen(breakdown)).toBe(4_000);
  });

  it("excludes card funding from savings but counts card purchases", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement([
          row("2026-11-09T04:00:00.000Z", 12_000, 1, "card_payment"),
        ]),
        statement([row("2026-11-09T12:00:00.000Z", 3_500, 2, "purchase")], "credit_card"),
      ],
      "2026-11",
    );
    expect(breakdown.map((b) => b.label)).toEqual(["purchase"]);
    expect(spending_total_sen(breakdown)).toBe(3_500);
  });

  it("still includes unpaired transfer rows (no matched leg in data)", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement([
          row("2026-11-10T04:00:00.000Z", 2_000, 1, "transfer"),
          row("2026-11-10T12:00:00.000Z", 1_000, 2, "interest"),
        ]),
      ],
      "2026-11",
    );
    expect(breakdown.map((b) => b.label)).toEqual(
      expect.arrayContaining(["transfer", "interest"]),
    );
    expect(spending_total_sen(breakdown)).toBe(3_000);
  });
});