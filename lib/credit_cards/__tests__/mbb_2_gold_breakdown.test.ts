import { describe, expect, it } from "vitest";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import {
  mbb_2_gold_card_breakdown,
  mbb_2_gold_limit_segment_sen,
  mbb_2_gold_used_limit_sen,
} from "@/lib/credit_cards/mbb_2_gold_breakdown";

function row(
  partial: Partial<TransactionDbRow> & Pick<TransactionDbRow, "sort_id" | "date">,
): TransactionDbRow {
  return {
    description: "",
    detail: "",
    txn_type: "purchase",
    in_sen: 0,
    out_sen: 0,
    balance_sen: 0,
    in_micro: 0,
    out_micro: 0,
    balance_micro: 0,
    ...partial,
  };
}

describe("mbb_2_gold_card_breakdown", () => {
  const month = "2026-10";
  const visa = [
    row({
      sort_id: 1,
      date: "2026-10-20T00:00:00Z",
      in_sen: 100,
      balance_sen: 900,
    }),
    row({
      sort_id: 2,
      date: "2026-10-05T00:00:00Z",
      out_sen: 300,
      balance_sen: 1_000,
    }),
  ];
  const amex = [
    row({
      sort_id: 3,
      date: "2026-10-08T00:00:00Z",
      out_sen: 200,
      balance_sen: 500,
    }),
  ];
  const combined = [...visa, ...amex].sort((a, b) => {
    const by_date = b.date.localeCompare(a.date);
    if (by_date !== 0) return by_date;
    return b.sort_id - a.sort_id;
  });

  it("aggregates spending, payments, and outstanding per row", () => {
    const rows = mbb_2_gold_card_breakdown(
      month,
      visa,
      amex,
      combined,
      900,
      500,
    );
    const visa_row = rows.find((r) => r.key === "1697")!;
    const amex_row = rows.find((r) => r.key === "8060")!;
    const combined_row = rows.find((r) => r.key === "combined")!;

    expect(visa_row.spending_sen).toBe(300);
    expect(visa_row.payments_sen).toBe(100);
    expect(visa_row.outstanding_sen).toBe(900);
    expect(amex_row.spending_sen).toBe(200);
    expect(amex_row.outstanding_sen).toBe(500);
    expect(combined_row.spending_sen).toBe(500);
    expect(combined_row.payments_sen).toBe(100);
    expect(combined_row.outstanding_sen).toBe(1_400);
  });

  it("sums segments for shared limit used", () => {
    const breakdown = mbb_2_gold_card_breakdown(
      month,
      visa,
      amex,
      combined,
      900,
      500,
    );
    expect(mbb_2_gold_used_limit_sen(breakdown)).toBe(1_400);
    expect(mbb_2_gold_limit_segment_sen(breakdown)).toEqual({
      visa_sen: 900,
      amex_sen: 500,
    });
  });
});