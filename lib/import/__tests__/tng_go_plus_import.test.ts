import { describe, expect, it } from "vitest";
import { parse_tng_wallet_statement } from "@/lib/import/parsers/tng_wallet";
import {
  mark_duplicate_matches,
  type ExistingTxnForDedupe,
} from "@/lib/import/dedupe_match";
import { map_import_rows_to_statement_rows } from "@/lib/import/map_preview_rows";
import type { NormalizedImportRow } from "@/lib/import/types";

const GO_INTEREST_FIXTURE = `
TNG WALLET TRANSACTION HISTORY
GO+ TRANSACTION
5/11/2026 Success GO+ Daily Earnings 1001   RM0.0006   RM7.16
3/11/2026 Success GO+ Daily Earnings 1002   RM0.0006   RM7.16
`;

describe("TNG GO+ import preview", () => {
  it("does not flag sub-sen interest when statement balance stays at 2dp", () => {
    const { rows } = parse_tng_wallet_statement(GO_INTEREST_FIXTURE);
    const go = rows.filter((r) => r.account_ref === "TNG_GO_PLUS");
    expect(go).toHaveLength(2);
    for (const row of go) {
      expect(row.review_reasons).not.toContain(
        "GO+ balance gap (may be unreconciled GO+ outflow)",
      );
      expect(row.amount_major).toBe("0.0006");
    }
  });

  it("shows sub-sen amounts in preview micro columns", () => {
    const { rows } = parse_tng_wallet_statement(GO_INTEREST_FIXTURE);
    const preview = map_import_rows_to_statement_rows(rows);
    const go_preview = preview.filter((r) => r.tng_sub_account === "go_plus");
    expect(go_preview[0]?.in_micro).toBe(6);
    expect(go_preview[0]?.balance_micro).toBe(71_600);
  });

  it("dedupes needs_review GO+ rows by balance fingerprint", () => {
    const { rows } = parse_tng_wallet_statement(GO_INTEREST_FIXTURE);
    const go = rows.filter((r) => r.account_ref === "TNG_GO_PLUS");
    const flagged: NormalizedImportRow[] = go.map((r, i) => ({
      ...r,
      temp_id: `go-${i}`,
      status: "needs_review",
      review_reasons: ["GO+ balance gap (may be unreconciled GO+ outflow)"],
    }));

    const existing: ExistingTxnForDedupe[] = go.map((r, i) => ({
      id: 300 + i,
      txn_at: r.txn_at,
      direction: r.direction,
      amount: r.amount_major,
      balance_after: r.balance_after_major,
      description: "legacy",
      detail: "QSR Stores",
    }));

    mark_duplicate_matches(flagged, existing, 5);
    expect(flagged.every((r) => r.status === "duplicate")).toBe(true);
  });
});