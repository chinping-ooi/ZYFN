import { describe, expect, it } from "vitest";
import { transaction_month_options } from "@/lib/supabase/transaction_statement";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";

function row(date: string, sort_id: number): TransactionDbRow {
  return {
    date,
    description: "",
    detail: "",
    txn_type: "debit",
    in_sen: 0,
    out_sen: 100,
    balance_sen: 0,
    in_micro: 0,
    out_micro: 0,
    balance_micro: 0,
    sort_id,
  };
}

describe("transaction_month_options", () => {
  it("keeps All months first and orders calendar months newest first", () => {
    const options = transaction_month_options([
      row("2026-08-15T04:00:00.000Z", 1),
      row("2026-11-05T04:00:00.000Z", 2),
      row("2026-09-10T04:00:00.000Z", 3),
    ]);
    expect(options[0]?.value).toBe("all");
    expect(options.map((o) => o.value)).toEqual([
      "all",
      "2026-11",
      "2026-09",
      "2026-08",
    ]);
  });
});