import { describe, expect, it } from "vitest";
import { parse_tng_wallet_statement } from "@/lib/import/parsers/tng_wallet";
import { mark_duplicate_matches } from "@/lib/import/dedupe_match";
import type { ExistingTxnForDedupe } from "@/lib/import/dedupe_match";
import type { NormalizedImportRow } from "@/lib/import/types";
import { validate_running_balance } from "@/lib/import/validate";

const NOV1_SAME_DAY_FIXTURE = `
TNG WALLET TRANSACTION HISTORY
TNG WALLET TRANSACTION
1/11/2026 Success Refund 9001 Store credit RM1.00 RM7.20
1/11/2026 Success Payment 9002 QSR Stores RM1.00 RM6.20
1/11/2026 Success Payment 9003 Merchant RM7.99 RM7.20
1/11/2026 Success Reload 9004 Top up RM7.99 RM15.19
`;

describe("tng_wallet same-day chronological order", () => {
  it("orders 1 Nov wallet rows oldest-first and validates running balance", () => {
    const { rows } = parse_tng_wallet_statement(NOV1_SAME_DAY_FIXTURE);
    const wallet = rows
      .filter((r) => r.account_id === 4)
      .filter((r) => r.txn_at.startsWith("2026-11-01"));

    expect(wallet.map((r) => r.amount_major)).toEqual([
      "7.99",
      "7.99",
      "1.00",
      "1.00",
    ]);
    expect(wallet.map((r) => r.balance_after_major)).toEqual([
      "15.19",
      "7.20",
      "6.20",
      "7.20",
    ]);
    expect(wallet.map((r) => r.direction)).toEqual([
      "in",
      "out",
      "out",
      "in",
    ]);

    const txn_times = wallet.map((r) => r.txn_at);
    expect(new Set(txn_times).size).toBe(4);

    validate_running_balance(wallet);
    for (const row of wallet) {
      expect(row.review_reasons).not.toContain("Balance mismatch");
    }
  });

  it("marks four Nov rows duplicate via TNG balance match despite label drift", () => {
    const { rows } = parse_tng_wallet_statement(NOV1_SAME_DAY_FIXTURE);
    const wallet = rows.filter((r) => r.account_id === 4);

    const existing: ExistingTxnForDedupe[] = wallet.map((r, i) => ({
      id: 100 + i,
      txn_at: r.txn_at,
      direction: r.direction,
      amount: r.amount_major,
      balance_after: r.balance_after_major,
      description: `legacy label ${i}`,
      detail: "purchase",
    }));

    const imports: NormalizedImportRow[] = wallet.map((r, i) => ({
      ...r,
      temp_id: `imp-${i}`,
      description: r.description,
      review_reasons: [] as string[],
      status: "new" as const,
    }));

    mark_duplicate_matches(imports, existing, 4);

    expect(imports.every((r) => r.status === "duplicate")).toBe(true);
    expect(imports.some((r) => r.review_reasons[0]?.match(/Similar saved/))).toBe(
      false,
    );
  });
});