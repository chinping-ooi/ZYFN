import { describe, expect, it } from "vitest";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { pocket_closing_as_of_month } from "@/lib/supabase/transaction_statement";

function row(
  partial: Partial<TransactionDbRow> & Pick<TransactionDbRow, "date" | "sort_id">,
): TransactionDbRow {
  return {
    description: "",
    detail: "",
    txn_type: "",
    in_sen: 0,
    out_sen: 0,
    balance_sen: 0,
    in_micro: 0,
    out_micro: 0,
    balance_micro: 0,
    ...partial,
  };
}

describe("pocket_closing_as_of_month", () => {
  const ledger = [
    row({
      date: "2026-11-22T10:00:00.000Z",
      sort_id: 2,
      balance_micro: 34_000,
      balance_sen: 340,
    }),
    row({
      date: "2026-10-15T04:00:00.000Z",
      sort_id: 1,
      balance_micro: 50_000,
      balance_sen: 500,
    }),
  ];

  it("uses the newest row on or before the month", () => {
    expect(pocket_closing_as_of_month(ledger, "2026-11").closing_micro).toBe(
      34_000,
    );
    expect(pocket_closing_as_of_month(ledger, "2026-10").closing_micro).toBe(
      50_000,
    );
  });

  it("returns zero when no row exists on or before the month", () => {
    expect(pocket_closing_as_of_month(ledger, "2026-08").closing_micro).toBe(0);
  });
});