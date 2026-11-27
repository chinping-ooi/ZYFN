import { describe, expect, it } from "vitest";
import { map_transaction_row } from "@/lib/supabase/transaction_rows";
import type { ZyfnTransactionRow } from "@/lib/supabase/transaction_rows";
import {
  combined_tng_closing_for_statement,
  merge_tng_statement_rows,
} from "@/lib/tng/combined_statement";
import { partition_tng_source_rows, tng_balance_pocket } from "@/lib/tng/pocket";

function db_row(partial: Partial<ZyfnTransactionRow> & Pick<ZyfnTransactionRow, "id" | "txn_at">): ZyfnTransactionRow {
  return {
    txn_type: "",
    description: "",
    direction: "in",
    amount: 0,
    balance_after: 0,
    detail: "",
    ...partial,
  };
}

describe("single-code TNG ledger (real DB shape)", () => {
  const wallet_reload = map_transaction_row(
    db_row({
      id: 101,
      txn_at: "2026-11-22T10:00:00.000Z",
      txn_type: "Reload",
      direction: "in",
      amount: "2.3000",
      balance_after: "3.4000",
    }),
    "tng_wallet",
  );

  const go_daily = map_transaction_row(
    db_row({
      id: 102,
      txn_at: "2026-11-23T04:00:00.000Z",
      txn_type: "GO+ Daily Earnings",
      direction: "in",
      amount: "0.0018",
      balance_after: "21.0600",
    }),
    "tng_wallet",
  );

  it("maps wallet rows to micro amounts with 4 dp", () => {
    expect(wallet_reload.in_micro).toBe(23_000);
    expect(wallet_reload.balance_micro).toBe(34_000);
    expect(go_daily.in_micro).toBe(18);
    expect(go_daily.balance_micro).toBe(210_600);
  });

  it("classifies pockets by txn_type when all rows share one account", () => {
    expect(tng_balance_pocket(wallet_reload)).toBe("wallet");
    expect(tng_balance_pocket(go_daily)).toBe("go_plus");
    const { wallet_rows, go_plus_rows } = partition_tng_source_rows([
      go_daily,
      wallet_reload,
    ]);
    expect(wallet_rows).toHaveLength(1);
    expect(go_plus_rows).toHaveLength(1);
    expect(wallet_rows[0].balance_micro).toBe(34_000);
    expect(go_plus_rows[0].balance_micro).toBe(210_600);
  });

  it("combined closing for November equals eWallet + GO+ month-end balances", () => {
    const { wallet_rows, go_plus_rows } = partition_tng_source_rows([
      go_daily,
      wallet_reload,
    ]);
    const merged = merge_tng_statement_rows(wallet_rows, go_plus_rows);
    const full_micro = 34_000 + 210_600;
    const full_sen = 340 + 2106;

    const closing = combined_tng_closing_for_statement(
      merged,
      "2026-11",
      full_sen,
      full_micro,
    );

    expect(closing.closing_micro).toBe(full_micro);
    expect(closing.closing_sen).toBe(full_sen);
  });

  it("uses zero for a pocket with no activity on or before the selected month", () => {
    const older_wallet = map_transaction_row(
      db_row({
        id: 90,
        txn_at: "2026-10-01T10:00:00.000Z",
        txn_type: "Payment",
        direction: "out",
        amount: "1.0000",
        balance_after: "5.0000",
      }),
      "tng_wallet",
    );
    const { wallet_rows, go_plus_rows } = partition_tng_source_rows([
      go_daily,
      wallet_reload,
      older_wallet,
    ]);
    const merged = merge_tng_statement_rows(wallet_rows, go_plus_rows);

    const closing = combined_tng_closing_for_statement(
      merged,
      "2026-09",
      0,
      0,
    );

    expect(closing.closing_micro).toBe(0);
    expect(closing.closing_sen).toBe(0);
  });
});