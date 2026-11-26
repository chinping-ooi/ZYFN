import { describe, expect, it } from "vitest";
import {
  amount_fingerprint,
  mark_duplicate_matches,
  normalize_amount_major,
  type ExistingTxnForDedupe,
} from "@/lib/import/dedupe_match";
import type { NormalizedImportRow } from "@/lib/import/types";

function import_row(
  partial: Partial<NormalizedImportRow> & Pick<NormalizedImportRow, "temp_id">,
): NormalizedImportRow {
  return {
    txn_at: "2026-10-24T00:00:00Z",
    description: "CTX RO PRAI",
    detail: "Posted 25 Oct",
    txn_type: "purchase",
    direction: "out",
    amount_major: "50.00",
    balance_after_major: "100.00",
    in_sen: 0,
    out_sen: 5000,
    balance_sen: 10000,
    status: "new",
    review_reasons: [],
    ...partial,
  };
}

function existing(
  partial: Partial<ExistingTxnForDedupe> & Pick<ExistingTxnForDedupe, "id">,
): ExistingTxnForDedupe {
  return {
    txn_at: "2026-10-24T00:00:00Z",
    direction: "out",
    amount: "50.00",
    description: "Different merchant text",
    detail: null,
    ...partial,
  };
}

describe("mark_duplicate_matches", () => {
  it("matches on account amount direction and date despite different description", () => {
    const rows = [import_row({ temp_id: "a" })];
    mark_duplicate_matches(rows, [existing({ id: 1 })]);
    expect(rows[0]?.status).toBe("duplicate");
    expect(rows[0]?.review_reasons[0]).toMatch(/Matches saved record/);
  });

  it("ignores balance_after differences", () => {
    const rows = [
      import_row({ temp_id: "a", balance_after_major: "999.99" }),
    ];
    mark_duplicate_matches(rows, [existing({ id: 1 })]);
    expect(rows[0]?.status).toBe("duplicate");
  });

  it("matches when import txn date and existing posted-style detail differ within 3 days", () => {
    const rows = [
      import_row({
        temp_id: "a",
        txn_at: "2026-10-26T00:00:00Z",
        detail: "Posted 25 Oct",
      }),
    ];
    mark_duplicate_matches(rows, [
      existing({
        id: 1,
        txn_at: "2026-10-24T00:00:00Z",
        detail: "Posted 24 Oct",
      }),
    ]);
    expect(rows[0]?.status).toBe("duplicate");
  });

  it("normalizes 50 and 50.00 to the same fingerprint", () => {
    expect(amount_fingerprint("out", "50")).toBe(amount_fingerprint("out", "50.00"));
    expect(normalize_amount_major(50)).toBe("50.00");
  });

  it("consumes one existing row per import when two imports share amount and day", () => {
    const rows = [
      import_row({ temp_id: "a" }),
      import_row({ temp_id: "b", description: "Second shop" }),
    ];
    mark_duplicate_matches(rows, [existing({ id: 1 })]);
    const dup = rows.filter((r) => r.status === "duplicate");
    const fresh = rows.filter((r) => r.status === "new");
    expect(dup).toHaveLength(1);
    expect(fresh).toHaveLength(1);
  });
});