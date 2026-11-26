import { describe, expect, it } from "vitest";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";
import {
  DASHBOARD_SUMMARY_ACCOUNT_ALL,
  dashboard_summary_source_rows,
} from "@/lib/dashboard/dashboard_summary";
import { kl_month_key } from "@/lib/datetime/kl_month_key";

function row(
  partial: Partial<TransactionDbRow> & Pick<TransactionDbRow, "sort_id" | "date">,
): TransactionDbRow {
  return {
    description: "",
    detail: "",
    txn_type: "Transfer",
    in_sen: 0,
    out_sen: 0,
    balance_sen: 0,
    in_micro: 0,
    out_micro: 0,
    balance_micro: 0,
    ...partial,
  };
}

function statement(
  partial: Pick<AccountStatementFromDb, "account_ref" | "account_label" | "account_kind" | "rows">,
): AccountStatementFromDb {
  return {
    kind: "data",
    account_code: undefined,
    amount_scale: partial.account_kind.startsWith("tng") ? "micro" : "sen",
    source: "supabase",
    total_in_sen: 0,
    total_out_sen: 0,
    closing_sen: 0,
    total_in_micro: 0,
    total_out_micro: 0,
    closing_micro: 0,
    row_count: partial.rows.length,
    ...partial,
  };
}

describe("dashboard_summary_source_rows all accounts", () => {
  const month = "2026-10";
  const statements: AccountStatementFromDb[] = [
    statement({
      account_ref: "MBB_SAVINGS",
      account_label: "Maybank Savings",
      account_kind: "bank",
      rows: [
        row({
          sort_id: 1,
          date: "2026-10-05T00:00:00.000Z",
          txn_type: "Salary",
          in_sen: 5_000,
        }),
        row({
          sort_id: 2,
          date: "2026-10-06T00:00:00.000Z",
          txn_type: "Transfer",
          out_sen: 1_000,
        }),
      ],
    }),
    statement({
      account_ref: "PBE_SAVINGS",
      account_label: "Public Bank Savings",
      account_kind: "bank",
      rows: [
        row({
          sort_id: 3,
          date: "2026-10-07T00:00:00.000Z",
          txn_type: "Transfer",
          in_sen: 1_000,
        }),
      ],
    }),
    statement({
      account_ref: "TNG_EWALLET",
      account_label: "TNG eWallet",
      account_kind: "tng_wallet",
      rows: [
        row({
          sort_id: 4,
          date: "2026-10-08T00:00:00.000Z",
          txn_type: "Reload",
          in_sen: 100,
          in_micro: 10_000,
        }),
      ],
    }),
    statement({
      account_ref: "TNG_GO_PLUS",
      account_label: "TNG GO+",
      account_kind: "tng_go_plus",
      rows: [
        row({
          sort_id: 5,
          date: "2026-10-08T00:00:00.000Z",
          txn_type: "GO+ Daily",
          in_micro: 50,
        }),
      ],
    }),
  ];

  it("merges every account and hides GO+ rows by default", () => {
    const merged = dashboard_summary_source_rows(
      statements,
      DASHBOARD_SUMMARY_ACCOUNT_ALL,
    );
    expect(merged.some((r) => r.sort_id === 5)).toBe(false);
    expect(merged.filter((r) => kl_month_key(r.date) === month)).toHaveLength(4);
  });

  it("aggregated month totals sum in and out across accounts", () => {
    const merged = dashboard_summary_source_rows(
      statements,
      DASHBOARD_SUMMARY_ACCOUNT_ALL,
    );
    const slice = build_transaction_statement(merged, month, 0, 0);
    expect(slice.total_in_sen).toBe(5_000 + 1_000 + 100);
    expect(slice.total_out_sen).toBe(1_000);
  });
});