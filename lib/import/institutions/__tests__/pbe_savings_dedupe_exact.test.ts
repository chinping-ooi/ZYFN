import { describe, expect, it } from "vitest";
import type { NormalizedImportRow } from "@/lib/import/types";
import {
  mark_duplicate_matches,
  TXN_SELECT_FOR_DEDUPE,
  type ExistingTxnForDedupe,
} from "@/lib/import/institutions/pbe_savings/dedupe";

function row(p: Partial<NormalizedImportRow>): NormalizedImportRow {
  return {
    temp_id: "pbe-sav-0",
    txn_at: "2026-11-03T00:00:00Z",
    description: "SYNTH TRSF CR 111111 SAMPLE SENDER — SYNTH MEMO — SYNTHREF0001",
    detail: "",
    txn_type: "transfer",
    direction: "in",
    amount_major: "50.00",
    balance_after_major: "60.00",
    in_sen: 0,
    out_sen: 0,
    balance_sen: 0,
    status: "new",
    review_reasons: [],
    account_id: 1,
    account_ref: "PBE_SAVINGS",
    ...p,
  };
}

function saved(p: Partial<ExistingTxnForDedupe>): ExistingTxnForDedupe {
  return {
    id: 1,
    // DB stores MYT midnight with offset.
    txn_at: "2026-11-03 00:00:00+08",
    direction: "in",
    amount: "50.00",
    balance_after: "60.00",
    description: "Different saved wording",
    detail: null,
    ...p,
  };
}

describe("pbe_savings dedupe exact ledger match", () => {
  it("selects balance_after for dedupe", () => {
    expect(TXN_SELECT_FOR_DEDUPE).toContain("balance_after");
  });

  it("marks a same date/direction/amount/balance row as existing even when descriptions differ", () => {
    const rows = [row({})];
    mark_duplicate_matches(rows, [saved({})], 1);
    expect(rows[0]?.status).toBe("duplicate");
    expect(rows[0]?.review_reasons[0]).toMatch(/^Matches saved record/);
  });

  it("pairs a same-day in/out of equal amount by balance, not by first fuzzy hit", () => {
    const rows = [
      row({ temp_id: "pbe-sav-2", direction: "out", amount_major: "50.00", balance_after_major: "10.00", description: "SYNTH DR-ECP 222222 — SYNTH FD MEMO" }),
      row({ temp_id: "pbe-sav-1", direction: "in", amount_major: "50.00", balance_after_major: "60.00" }),
    ];
    const existing = [
      saved({ id: 7, direction: "in", balance_after: "60.00" }),
      saved({ id: 8, direction: "out", balance_after: "10.00", description: "Other saved wording" }),
    ];
    mark_duplicate_matches(rows, existing, 1);
    expect(rows.map((r) => r.status)).toEqual(["duplicate", "duplicate"]);
  });

  it("does not let a fuzzy pick consume another row's exact twin", () => {
    const rows = [
      // Processed first; no balance twin, fuzzy-eligible for both saved rows.
      row({ temp_id: "pbe-sav-5", txn_at: "2026-11-02T00:00:00Z", balance_after_major: "99.00" }),
      row({ temp_id: "pbe-sav-4" }),
    ];
    const existing = [
      saved({ id: 3, description: "SYNTH TRSF CR 111111 SAMPLE SENDER" }),
    ];
    mark_duplicate_matches(rows, existing, 1);
    expect(rows[1]?.status).toBe("duplicate");
    expect(rows[0]?.status).toBe("new");
  });

  it("keeps fuzzy similar-record review when balance differs", () => {
    const rows = [row({ balance_after_major: "61.00" })];
    mark_duplicate_matches(rows, [saved({})], 1);
    expect(rows[0]?.status).toBe("needs_review");
    expect(rows[0]?.review_reasons[0]).toMatch(/^Similar saved record/);
  });
});