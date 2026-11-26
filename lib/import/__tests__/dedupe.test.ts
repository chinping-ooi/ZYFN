import { describe, expect, it } from "vitest";
import { mark_duplicate_matches } from "@/lib/import/dedupe";
import type { NormalizedImportRow } from "@/lib/import/types";

function row(partial: Partial<NormalizedImportRow>): NormalizedImportRow {
  return {
    temp_id: "t1",
    txn_at: "2025-11-01T00:00:00Z",
    description: "Coffee",
    detail: "",
    txn_type: "",
    direction: "out",
    amount_major: "5.00",
    balance_after_major: "100.00",
    in_sen: 0,
    out_sen: 500,
    balance_sen: 10000,
    status: "new",
    review_reasons: [],
    ...partial,
  };
}

describe("mark_duplicate_matches export", () => {
  it("marks fuzzy duplicate matches", () => {
    const rows = [row({})];
    mark_duplicate_matches(rows, [
      {
        id: 9,
        txn_at: "2025-11-01T12:00:00Z",
        direction: "out",
        amount: 5,
        description: "CAFE",
        detail: null,
      },
    ]);
    expect(rows[0]?.status).toBe("duplicate");
  });
});