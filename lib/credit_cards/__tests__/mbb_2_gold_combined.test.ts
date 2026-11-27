import { describe, expect, it } from "vitest";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import {
  filter_inter_mbb_2_gold_payments,
  is_inter_mbb_2_gold_payment,
  merge_mbb_2_gold_rows,
  prepare_mbb_2_gold_combined_rows,
} from "@/lib/credit_cards/mbb_2_gold_combined";

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

describe("merge_mbb_2_gold_rows", () => {
  it("sorts visa and amex rows newest first", () => {
    const merged = merge_mbb_2_gold_rows(
      [row({ sort_id: 1, date: "2026-10-01T00:00:00Z", out_sen: 10 })],
      [row({ sort_id: 2, date: "2026-10-05T00:00:00Z", out_sen: 20 })],
    );
    expect(merged[0]?.sort_id).toBe(2);
    expect(merged[1]?.sort_id).toBe(1);
  });
});

describe("inter-card payment filter", () => {
  it("removes visa payment described as Amex gold", () => {
    const merged = merge_mbb_2_gold_rows(
      [
        row({
          sort_id: 1,
          date: "2026-10-01T00:00:00Z",
          txn_type: "cc_payment",
          description: "PAYMENT TO MAYBANK 2 GOLD AMEX 8060",
          in_sen: 500,
        }),
      ],
      [],
    );
    expect(filter_inter_mbb_2_gold_payments(merged)).toHaveLength(0);
  });

  it("keeps unrelated purchases on both cards", () => {
    const out = prepare_mbb_2_gold_combined_rows(
      [
        row({
          sort_id: 1,
          date: "2026-10-01T00:00:00Z",
          txn_type: "purchase",
          description: "SHOP A",
          out_sen: 100,
        }),
      ],
      [
        row({
          sort_id: 2,
          date: "2026-10-02T00:00:00Z",
          txn_type: "purchase",
          description: "SHOP B",
          out_sen: 200,
        }),
      ],
    );
    expect(out).toHaveLength(2);
  });
});

describe("is_inter_mbb_2_gold_payment", () => {
  it("detects amex-target payment on visa", () => {
    const merged = merge_mbb_2_gold_rows(
      [
        row({
          sort_id: 1,
          date: "2026-10-01T00:00:00Z",
          txn_type: "cc_payment",
          description: "MAYBANK 2 GOLD AMEX",
          in_sen: 1,
        }),
      ],
      [],
    );
    expect(is_inter_mbb_2_gold_payment(merged[0]!)).toBe(true);
  });
});