import { describe, expect, it } from "vitest";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import {
  combined_tng_closing_for_statement,
  combined_tng_closing_sen,
  filter_tng_rows_for_go_plus_visibility,
  merge_tng_statement_rows,
} from "@/lib/tng/combined_statement";

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

describe("merge_tng_statement_rows", () => {
  it("sorts merged wallet and GO+ rows by date then sort_id", () => {
    const wallet = [
      row({
        date: "2025-01-02T00:00:00.000Z",
        sort_id: 2,
        balance_sen: 500,
        in_sen: 500,
        in_micro: 50_000,
        balance_micro: 50_000,
      }),
    ];
    const go = [
      row({
        date: "2025-01-03T00:00:00.000Z",
        sort_id: 9,
        balance_micro: 1_0000,
      }),
    ];
    const merged = merge_tng_statement_rows(wallet, go);
    expect(merged).toHaveLength(2);
    expect(merged[0].sort_id).toBe(9);
    expect(merged[0].tng_sub_account).toBe("go_plus");
    expect(merged[1].tng_sub_account).toBe("wallet");
  });
});

describe("filter_tng_rows_for_go_plus_visibility", () => {
  const rows: TransactionDbRow[] = [
    row({
      date: "2025-01-01T00:00:00.000Z",
      sort_id: 1,
      tng_sub_account: "wallet",
      txn_type: "Reload",
    }),
    row({
      date: "2025-01-01T00:00:00.000Z",
      sort_id: 2,
      tng_sub_account: "wallet",
      txn_type: "GO+ Cash Out",
      description: "GO+ Cash Out",
    }),
    row({
      date: "2025-01-01T00:00:00.000Z",
      sort_id: 3,
      tng_sub_account: "go_plus",
      txn_type: "GO+ Daily",
    }),
  ];

  it("hides GO+ rows and wallet GO+ Cash Out when unchecked", () => {
    const visible = filter_tng_rows_for_go_plus_visibility(rows, false);
    expect(visible.map((r) => r.sort_id)).toEqual([1]);
  });

  it("shows all rows when checked", () => {
    const visible = filter_tng_rows_for_go_plus_visibility(rows, true);
    expect(visible).toHaveLength(3);
  });

  it("toggling show_go_plus changes visible row ids", () => {
    let show_go_plus = false;
    let visible = filter_tng_rows_for_go_plus_visibility(rows, show_go_plus);
    expect(visible.map((r) => r.sort_id)).toEqual([1]);

    show_go_plus = true;
    visible = filter_tng_rows_for_go_plus_visibility(rows, show_go_plus);
    expect(visible.map((r) => r.sort_id)).toEqual([1, 2, 3]);

    show_go_plus = false;
    visible = filter_tng_rows_for_go_plus_visibility(rows, show_go_plus);
    expect(visible.map((r) => r.sort_id)).toEqual([1]);
  });
});

describe("combined_tng_closing_for_statement", () => {
  it("sums per-pocket month-end balances (not the newest merged row only)", () => {
    const wallet = [
      row({
        date: "2025-10-15T00:00:00.000Z",
        sort_id: 2,
        tng_sub_account: "wallet",
        balance_sen: 1_000,
        balance_micro: 100_000,
      }),
      row({
        date: "2025-10-01T00:00:00.000Z",
        sort_id: 1,
        tng_sub_account: "wallet",
        balance_sen: 800,
        balance_micro: 80_000,
      }),
    ];
    const go = [
      row({
        date: "2025-10-20T00:00:00.000Z",
        sort_id: 4,
        tng_sub_account: "go_plus",
        txn_type: "GO+ Daily Earnings",
        balance_micro: 50_000,
        balance_sen: 500,
      }),
      row({
        date: "2025-10-05T00:00:00.000Z",
        sort_id: 3,
        tng_sub_account: "go_plus",
        txn_type: "GO+ Daily Earnings",
        balance_micro: 40_000,
        balance_sen: 400,
      }),
    ];
    const merged = merge_tng_statement_rows(wallet, go);
    const full_sen = combined_tng_closing_sen(wallet, go);
    const full_micro = 100_000 + 50_000;

    const fixed = combined_tng_closing_for_statement(
      merged,
      "2025-10",
      full_sen,
      full_micro,
    );

    expect(fixed.closing_sen).toBe(1_000 + 500);
    expect(fixed.closing_micro).toBe(100_000 + 50_000);
  });

  it("uses loader totals for All months", () => {
    const merged = merge_tng_statement_rows(
      [
        row({
          date: "2025-10-01T00:00:00.000Z",
          sort_id: 1,
          balance_sen: 10,
          balance_micro: 1_000,
        }),
      ],
      [
        row({
          date: "2025-10-01T00:00:00.000Z",
          sort_id: 2,
          balance_micro: 2_000,
        }),
      ],
    );
    expect(
      combined_tng_closing_for_statement(merged, "all", 10 + 20, 1_000 + 2_000),
    ).toEqual({ closing_sen: 30, closing_micro: 3_000 });
  });
});

describe("combined_tng_closing_sen", () => {
  it("sums wallet sen balance with GO+ micro converted to sen", () => {
    const wallet = [
      row({
        date: "2025-01-01T00:00:00.000Z",
        sort_id: 1,
        balance_sen: 12_34,
      }),
    ];
    const go = [
      row({
        date: "2025-01-01T00:00:00.000Z",
        sort_id: 2,
        balance_micro: 56_78,
      }),
    ];
    expect(combined_tng_closing_sen(wallet, go)).toBe(12_34 + 57);
  });
});