import { describe, expect, it } from "vitest";
import {
  daily_spending_for_month,
  daily_spending_txn_count_label,
  is_credit_card_payment_daily_chart_row,
  is_fixed_deposit_daily_chart_row,
} from "@/lib/dashboard/daily_spending";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";

function row(
  date: string,
  out_sen: number,
  sort_id: number,
  txn_type = "debit",
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
  };
}

function statement(
  rows: TransactionDbRow[],
  account_kind: AccountStatementFromDb["account_kind"] = "bank",
  account_ref = "PBE_SAVINGS",
): AccountStatementFromDb {
  return {
    kind: "data",
    account_ref,
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

describe("daily_spending_for_month", () => {
  it("aggregates spending by KL calendar day and fills zero days", () => {
    const month = "2026-11";
    const data = daily_spending_for_month(
      [
        statement([
          row("2026-11-05T04:00:00.000Z", 10_000, 1),
          row("2026-11-05T12:00:00.000Z", 2_500, 2),
          row("2026-11-12T04:00:00.000Z", 5_000, 3),
        ]),
      ],
      month,
    );

    expect(data.days_in_month).toBe(30);
    expect(data.day_labels).toHaveLength(30);
    expect(data.spending_sen[4]).toBe(12_500);
    expect(data.spending_sen[11]).toBe(5_000);
    expect(data.spending_sen[0]).toBe(0);
    expect(data.month_total_sen).toBe(17_500);
    expect(data.txn_counts[4]).toBe(2);
    expect(data.txn_counts[11]).toBe(1);
    expect(daily_spending_txn_count_label(1)).toBe("1 txn");
    expect(daily_spending_txn_count_label(2)).toBe("2 txns");
  });

  it("excludes fixed deposit placements from the daily chart", () => {
    const month = "2026-11";
    const fd_row = row("2026-11-03T04:00:00.000Z", 50_000, 1, "fd_placement");
    expect(is_fixed_deposit_daily_chart_row(fd_row)).toBe(true);
    const data = daily_spending_for_month([statement([fd_row])], month);
    expect(data.month_total_sen).toBe(0);
    expect(data.spending_sen[2]).toBe(0);
  });

  it("excludes out rows linked by fixed_deposit_id", () => {
    const month = "2026-11";
    const linked = { ...row("2026-11-04T04:00:00.000Z", 20_000, 1), fixed_deposit_id: 42 };
    expect(is_fixed_deposit_daily_chart_row(linked)).toBe(true);
    const data = daily_spending_for_month([statement([linked])], month);
    expect(data.month_total_sen).toBe(0);
  });

  it("counts paired own-account transfers when they have an out amount", () => {
    const month = "2026-11";
    const transfer = {
      ...row("2026-11-08T04:00:00.000Z", 3_000, 1, "transfer"),
      pair_ref: "pair-abc",
    };
    const data = daily_spending_for_month([statement([transfer])], month);
    expect(data.spending_sen[7]).toBe(3_000);
  });

  it("excludes card bill pay from savings and the matching credit on the card", () => {
    const month = "2026-11";
    const date = "2026-11-15T04:00:00.000Z";
    const savings_pay = row(date, 8_000, 1, "cc_payment");
    const card_credit: TransactionDbRow = {
      ...row(date, 0, 2, "credit_card_payment"),
      in_sen: 8_000,
    };
    expect(is_credit_card_payment_daily_chart_row(savings_pay, "bank")).toBe(
      true,
    );
    expect(
      is_credit_card_payment_daily_chart_row(card_credit, "credit_card"),
    ).toBe(true);
    const data = daily_spending_for_month(
      [
        statement([savings_pay], "bank"),
        statement([card_credit], "credit_card", "MBB_VISA_1697"),
      ],
      month,
    );
    expect(data.month_total_sen).toBe(0);
    expect(data.txn_counts[14]).toBe(0);
  });

  it("still counts credit card purchases on the card ledger", () => {
    const month = "2026-11";
    const purchase: TransactionDbRow = {
      ...row("2026-11-16T04:00:00.000Z", 0, 1, "debit"),
      in_sen: 4_500,
    };
    expect(is_credit_card_payment_daily_chart_row(purchase, "credit_card")).toBe(
      false,
    );
    const data = daily_spending_for_month(
      [statement([purchase], "credit_card", "MBB_VISA_1697")],
      month,
    );
    expect(data.month_total_sen).toBe(4_500);
    expect(data.spending_sen[15]).toBe(4_500);
  });

  it("ignores transactions outside the selected month", () => {
    const data = daily_spending_for_month(
      [statement([row("2026-10-15T04:00:00.000Z", 9_999, 1)])],
      "2026-11",
    );
    expect(data.month_total_sen).toBe(0);
  });
});