import { describe, expect, it } from "vitest";
import { validate_running_balance } from "@/lib/import/validate";
import type { NormalizedImportRow } from "@/lib/import/types";

describe("validate_running_balance", () => {
  it("flags balance mismatch", () => {
    const rows: NormalizedImportRow[] = [
      {
        temp_id: "a",
        txn_at: "2025-11-01T00:00:00Z",
        description: "Start",
        detail: "",
        txn_type: "",
        direction: "in",
        amount_major: "100.00",
        balance_after_major: "100.00",
        in_sen: 10000,
        out_sen: 0,
        balance_sen: 10000,
        status: "new",
        review_reasons: [],
      },
      {
        temp_id: "b",
        txn_at: "2025-11-02T00:00:00Z",
        description: "Spend",
        detail: "",
        txn_type: "",
        direction: "out",
        amount_major: "10.00",
        balance_after_major: "50.00",
        in_sen: 0,
        out_sen: 1000,
        balance_sen: 5000,
        status: "new",
        review_reasons: [],
      },
    ];
    validate_running_balance(rows);
    expect(rows[1]?.status).toBe("needs_review");
    expect(rows[1]?.review_reasons).toContain("Balance mismatch");
  });
});