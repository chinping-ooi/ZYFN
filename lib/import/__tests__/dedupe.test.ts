import { describe, expect, it } from "vitest";
import { mark_duplicates } from "@/lib/import/dedupe";
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

describe("mark_duplicates", () => {
  it("marks rows matching existing keys", () => {
    const keys = new Set(["1|2025-11-01|5.00|coffee|100.00"]);
    const rows = [row({})];
    mark_duplicates(1, rows, keys);
    expect(rows[0]?.status).toBe("duplicate");
  });
});