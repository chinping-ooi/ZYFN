import { describe, expect, it } from "vitest";
import { map_transaction_row } from "@/lib/supabase/transaction_rows";
import type { ZyfnTransactionRow } from "@/lib/supabase/transaction_rows";
import {
  combined_tng_closing_for_statement,
  merge_tng_statement_rows,
} from "@/lib/tng/combined_statement";
import {
  merge_tng_pocket_ledgers,
  partition_tng_source_rows,
  tng_balance_pocket,
} from "@/lib/tng/pocket";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";

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

  it("Overview combined balance matches eWallet tab + GO+ tab (7.20 + 15.15)", () => {
    const ewallet_txn = map_transaction_row(
      db_row({
        id: 201,
        txn_at: "2026-11-20T12:00:00.000Z",
        txn_type: "Payment",
        direction: "out",
        amount: "1.0000",
        balance_after: "7.2000",
      }),
      "tng_wallet",
    );
    const reload_on_go_account = map_transaction_row(
      db_row({
        id: 202,
        txn_at: "2026-11-18T08:00:00.000Z",
        txn_type: "Reload",
        direction: "in",
        amount: "5.0000",
        balance_after: "7.2000",
      }),
      "tng_go_plus",
    );
    const go_daily = map_transaction_row(
      db_row({
        id: 203,
        txn_at: "2026-11-21T04:00:00.000Z",
        txn_type: "GO+ Daily Earnings",
        direction: "in",
        amount: "0.0012",
        balance_after: "15.1500",
      }),
      "tng_go_plus",
    );

    expect(tng_balance_pocket(reload_on_go_account)).toBe("wallet");

    const { wallet_rows, go_plus_rows } = merge_tng_pocket_ledgers(
      [ewallet_txn],
      [reload_on_go_account, go_daily],
    );
    expect(wallet_rows).toHaveLength(2);
    expect(go_plus_rows).toHaveLength(1);

    const wallet_full = wallet_rows[0].balance_micro;
    const go_full = go_plus_rows[0].balance_micro;
    const wallet_tab = build_transaction_statement(
      wallet_rows,
      "2026-11",
      0,
      wallet_full,
    );
    const go_tab = build_transaction_statement(go_plus_rows, "2026-11", 0, go_full);
    expect(wallet_tab.closing_micro).toBe(72_000);
    expect(go_tab.closing_micro).toBe(151_500);

    const merged = merge_tng_statement_rows(wallet_rows, go_plus_rows);
    const overview = combined_tng_closing_for_statement(
      merged,
      "2026-11",
      wallet_tab.closing_sen + Math.round(go_tab.closing_micro / 100),
      wallet_tab.closing_micro + go_tab.closing_micro,
    );
    expect(overview.closing_micro).toBe(223_500);
  });

  it("falls back to latest pocket balance when the month has no rows (matches sub-tabs)", () => {
    const { wallet_rows, go_plus_rows } = partition_tng_source_rows([
      go_daily,
      wallet_reload,
    ]);
    const merged = merge_tng_statement_rows(wallet_rows, go_plus_rows);
    const full_micro = wallet_reload.balance_micro + go_daily.balance_micro;

    const closing = combined_tng_closing_for_statement(
      merged,
      "2026-09",
      0,
      full_micro,
    );

    expect(closing.closing_micro).toBe(full_micro);
  });
});