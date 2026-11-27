import { describe, expect, it } from "vitest";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";
import { in_out_flow_breakdown } from "@/lib/transactions/in_out_flow";

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

describe("in_out_flow_breakdown", () => {
  const rows: TransactionDbRow[] = [
    row({ sort_id: 1, in_sen: 10_000, in_micro: 1_000_000 }),
    row({ sort_id: 2, out_sen: 3_000, out_micro: 300_000 }),
    row({ sort_id: 3, out_sen: 2_000, out_micro: 200_000 }),
  ];

  it("sen: net equals in minus non-FD out minus FD out", () => {
    const statement = build_transaction_statement(rows, "all", 0, 0);
    const flow = in_out_flow_breakdown(
      statement.rows,
      "sen",
      "Total in",
      "Total out",
    );

    expect(flow.slices).toHaveLength(3);
    expect(flow.total_in_sen).toBe(statement.total_in_sen);
    expect(flow.total_out_sen).toBe(statement.total_out_sen);
    expect(flow.total_fd_out_sen).toBe(0);
    expect(flow.net_sen).toBe(statement.total_in_sen - statement.total_out_sen);
    expect(flow.slices.reduce((s, r) => s + r.pct, 0)).toBeCloseTo(100, 5);
  });

  it("wallet Overview: two slices with FD merged into total out", () => {
    const with_fd: TransactionDbRow[] = [
      row({ sort_id: 1, in_sen: 100_000 }),
      row({ sort_id: 2, out_sen: 10_000, txn_type: "purchase" }),
      row({ sort_id: 3, out_sen: 50_000, txn_type: "fd_placement" }),
    ];
    const flow = in_out_flow_breakdown(
      with_fd,
      "sen",
      "Total in",
      "Total out",
      { include_fd_slice: false },
    );
    expect(flow.slices).toHaveLength(2);
    expect(flow.slices[1]?.amount_sen).toBe(60_000);
    expect(flow.net_sen).toBe(40_000);
  });

  it("splits FD placement out into its own slice", () => {
    const with_fd: TransactionDbRow[] = [
      row({ sort_id: 1, in_sen: 500_000 }),
      row({ sort_id: 2, out_sen: 60_478, txn_type: "purchase" }),
      row({ sort_id: 3, out_sen: 200_000, txn_type: "fd_placement" }),
    ];
    const statement = build_transaction_statement(with_fd, "all", 0, 0);
    const flow = in_out_flow_breakdown(
      statement.rows,
      "sen",
      "Total in",
      "Total out",
    );

    expect(flow.total_out_sen).toBe(60_478);
    expect(flow.total_fd_out_sen).toBe(200_000);
    expect(flow.net_sen).toBe(500_000 - 60_478);
    expect(flow.slices[2]?.label).toBe("FD");
    expect(flow.slices[2]?.pct).toBeCloseTo((200_000 / 760_478) * 100, 1);
  });

  it("micro: net micro equals total in micro minus outs", () => {
    const statement = build_transaction_statement(rows, "all", 0, 0);
    const flow = in_out_flow_breakdown(
      statement.rows,
      "micro",
      "Total in",
      "Total out",
    );

    expect(flow.total_in_micro).toBe(statement.total_in_micro);
    expect(flow.total_out_micro).toBe(statement.total_out_micro);
    expect(flow.net_micro).toBe(
      statement.total_in_micro - statement.total_out_micro,
    );
  });
});