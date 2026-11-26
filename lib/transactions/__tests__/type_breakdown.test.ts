import { describe, expect, it } from "vitest";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";
import { is_spending_donut_fd_row } from "@/lib/dashboard/spending_donut_fd";
import { txn_type_breakdown } from "@/lib/transactions/type_breakdown";

function row(
  partial: Partial<TransactionDbRow> & Pick<TransactionDbRow, "sort_id">,
): TransactionDbRow {
  return {
    date: "2025-03-10T00:00:00.000Z",
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

describe("txn_type_breakdown", () => {
  const rows: TransactionDbRow[] = [
    row({
      sort_id: 1,
      txn_type: "Reload",
      in_sen: 5_000,
      in_micro: 500_000,
    }),
    row({
      sort_id: 2,
      txn_type: "Reload",
      in_sen: 2_000,
      in_micro: 200_000,
    }),
    row({
      sort_id: 3,
      txn_type: "Payment",
      out_sen: 1_500,
      out_micro: 150_000,
    }),
    row({
      sort_id: 4,
      txn_type: "Payment",
      out_sen: 500,
      out_micro: 50_000,
    }),
    row({
      sort_id: 5,
      txn_type: "",
      out_sen: 250,
      out_micro: 25_000,
    }),
  ];

  it("sen scale: slice sums equal statement total in/out", () => {
    const statement = build_transaction_statement(rows, "all", 0, 0);
    const breakdown_in = txn_type_breakdown(statement.rows, "in", "sen");
    const breakdown_out = txn_type_breakdown(statement.rows, "out", "sen");

    expect(breakdown_in.total_sen).toBe(statement.total_in_sen);
    expect(breakdown_out.total_sen).toBe(statement.total_out_sen);
    expect(breakdown_in.rows.reduce((t, r) => t + r.amount_sen, 0)).toBe(
      statement.total_in_sen,
    );
    expect(breakdown_out.rows.reduce((t, r) => t + r.amount_sen, 0)).toBe(
      statement.total_out_sen,
    );
  });

  it("micro scale: slice sums equal statement total in/out", () => {
    const statement = build_transaction_statement(rows, "all", 0, 0);
    const breakdown_in = txn_type_breakdown(statement.rows, "in", "micro");
    const breakdown_out = txn_type_breakdown(statement.rows, "out", "micro");

    expect(breakdown_in.total_micro).toBe(statement.total_in_micro);
    expect(breakdown_out.total_micro).toBe(statement.total_out_micro);
  });

  it("excludes FD txn types from spending breakdown totals", () => {
    const fd_rows: TransactionDbRow[] = [
      row({ sort_id: 1, txn_type: "fd_placement", out_sen: 200_000 }),
      row({ sort_id: 2, txn_type: "purchase", out_sen: 60_478 }),
      row({ sort_id: 3, txn_type: "rental", out_sen: 100_000 }),
    ];
    const statement = build_transaction_statement(fd_rows, "all", 0, 0);
    const breakdown_out = txn_type_breakdown(statement.rows, "out", "sen", {
      exclude_row: is_spending_donut_fd_row,
    });
    expect(breakdown_out.rows.map((r) => r.label)).not.toContain("fd_placement");
    expect(breakdown_out.total_sen).toBe(160_478);
  });

  it("groups empty txn_type as Unclassified", () => {
    const statement = build_transaction_statement(rows, "all", 0, 0);
    const breakdown_out = txn_type_breakdown(statement.rows, "out", "sen");
    const unclassified = breakdown_out.rows.find(
      (r) => r.label === "Unclassified",
    );
    expect(unclassified?.amount_sen).toBe(250);
    expect(unclassified?.count).toBe(1);
  });
});