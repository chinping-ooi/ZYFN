import { describe, expect, it } from "vitest";
import { spending_breakdown_for_month, spending_total_sen } from "@/lib/dashboard/spending_breakdown";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";

function row(
  date: string,
  amount_sen: number,
  sort_id: number,
  txn_type = "debit",
  direction: "in" | "out" = "out",
  opts?: {
    detail?: string;
    description?: string;
    fixed_deposit_id?: number | null;
    pair_ref?: string | null;
    tng_sub_account?: "wallet" | "go_plus";
  },
): TransactionDbRow {
  return {
    date,
    description: opts?.description ?? "Sample",
    detail: opts?.detail ?? "",
    txn_type,
    in_sen: direction === "in" ? amount_sen : 0,
    out_sen: direction === "out" ? amount_sen : 0,
    balance_sen: 0,
    in_micro: 0,
    out_micro: 0,
    balance_micro: 0,
    sort_id,
    fixed_deposit_id: opts?.fixed_deposit_id ?? null,
    pair_ref: opts?.pair_ref ?? null,
    tng_sub_account: opts?.tng_sub_account,
  };
}

function statement(
  rows: TransactionDbRow[],
  account_kind: AccountStatementFromDb["account_kind"] = "bank",
  account_ref = "PBE_SAVINGS",
  account_label = "Public Bank",
  amount_scale: AccountStatementFromDb["amount_scale"] = "sen",
): AccountStatementFromDb {
  return {
    kind: "data",
    account_ref,
    account_label,
    account_kind,
    amount_scale,
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
          row("2026-11-02T04:00:00.000Z", 200_000, 1, "", "out", {
            detail: "fd_placement",
          }),
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
          row("2026-11-02T04:00:00.000Z", 99_000, 1, "debit", "out", {
            fixed_deposit_id: 7,
          }),
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
          row("2026-11-07T04:00:00.000Z", 25_000, 1, "transfer", "out", {
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

  it("excludes card payments from savings and credit card, keeps purchases", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement([
          row("2026-11-09T04:00:00.000Z", 12_000, 1, "card_payment"),
        ]),
        statement(
          [
            row("2026-11-09T08:00:00.000Z", 8_000, 2, "credit_card_payment", "in"),
            row("2026-11-09T12:00:00.000Z", 3_500, 3, "purchase"),
          ],
          "credit_card",
        ),
      ],
      "2026-11",
    );
    expect(breakdown.map((b) => b.label)).toEqual(["purchase"]);
    expect(spending_total_sen(breakdown)).toBe(3_500);
  });

  it("excludes TNG GO+ cash movements on wallet and GO+ ledger", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement(
          [
            row("2026-11-11T04:00:00.000Z", 50_000, 1, "GO+ Cash Out", "out", {
              description: "GO+ Cash Out",
            }),
            row("2026-11-11T12:00:00.000Z", 2_200, 2, "Payment"),
          ],
          "tng_wallet",
          "TNG_EWALLET",
          "TNG eWallet",
        ),
        statement(
          [row("2026-11-11T06:00:00.000Z", 1_000, 3, "GO+ Cash In", "in")],
          "tng_go_plus",
          "TNG_GO_PLUS",
          "TNG GO+",
        ),
      ],
      "2026-11",
    );
    expect(breakdown.map((b) => b.label)).toEqual(["Payment"]);
    expect(spending_total_sen(breakdown)).toBe(2_200);
  });

  it("still includes refund rows on credit cards", () => {
    const breakdown = spending_breakdown_for_month(
      [
        statement(
          [
            row("2026-11-12T04:00:00.000Z", 900, 1, "refund"),
            row("2026-11-12T12:00:00.000Z", 4_000, 2, "purchase"),
          ],
          "credit_card",
        ),
      ],
      "2026-11",
    );
    expect(breakdown.map((b) => b.label)).toEqual(
      expect.arrayContaining(["refund", "purchase"]),
    );
    expect(spending_total_sen(breakdown)).toBe(4_900);
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