import { describe, expect, it } from "vitest";
import type { NormalizedImportRow } from "@/lib/import/types";
import { validate_running_balance as mbb_savings_validate } from "@/lib/import/institutions/mbb_savings/validate";
import { validate_running_balance as mbb_card_validate } from "@/lib/import/institutions/mbb_card/validate";
import { validate_running_balance as pbe_savings_validate } from "@/lib/import/institutions/pbe_savings/validate";
import { validate_running_balance as pbe_card_validate } from "@/lib/import/institutions/pbe_card/validate";
import { parse_pbe_card_statement } from "@/lib/import/parsers/pbe_card";

/** Synthetic ledger: 12 rows on one day, emitted newest-first like the parsers do. */
function newest_first_same_day(
  prefix: string,
  mode: "asset" | "liability",
): NormalizedImportRow[] {
  const rows: NormalizedImportRow[] = [];
  let balance = 100;
  for (let i = 0; i < 12; i++) {
    const direction: "in" | "out" =
      mode === "asset" ? (i % 3 === 0 ? "in" : "out") : i % 3 === 0 ? "in" : "out";
    const amount = i + 1;
    if (mode === "asset") balance += direction === "in" ? amount : -amount;
    else balance += direction === "out" ? amount : -amount;
    rows.push({
      temp_id: `${prefix}-${i}`,
      txn_at: "2026-11-02T00:00:00Z",
      description: `SYNTH ROW ${i}`,
      detail: "",
      txn_type: "",
      direction,
      amount_major: amount.toFixed(2),
      balance_after_major: balance.toFixed(2),
      in_sen: 0,
      out_sen: 0,
      balance_sen: 0,
      status: "new",
      review_reasons: [],
    });
  }
  return rows.reverse();
}

describe("same-day validation uses PDF reading order", () => {
  const cases = [
    ["mbb_savings", mbb_savings_validate, "mbb-sav", "asset"],
    ["pbe_savings", pbe_savings_validate, "pbe-sav", "asset"],
    ["mbb_card", mbb_card_validate, "mbb-cc-visa", "liability"],
    ["pbe_card", pbe_card_validate, "pbe-cc", "liability"],
  ] as const;
  for (const [name, validate, prefix, mode] of cases) {
    it(`${name}: newest-first same-day rows are not flagged`, () => {
      const rows = newest_first_same_day(prefix, mode);
      validate(rows, mode);
      expect(rows.filter((r) => r.status === "needs_review")).toEqual([]);
    });
  }

  it("pbe_card: 10+ same-day rows keep numeric order and match grand total", () => {
    const purchases = Array.from(
      { length: 11 },
      (_, i) => ` 05 NOV    05 NOV           SYNTH SHOP ${String.fromCharCode(65 + i)}                           1.00`,
    );
    const text = [
      "PUBLIC BANK BERHAD",
      "PENYATA KAD / CARD STATEMENT",
      "Tarikh Penyata / Statement Date    16 NOV 2026",
      "MASTERCARD QUANTUM 1111 2222 3333 6357 CARDHOLDER",
      "Maklumat Transaksi / Transaction Details",
      " 17 OCT                     Previous Balance                         0.00",
      ...purchases,
      "This month total credit   0.00",
      "This month total debit   11.00",
      "Jumlah besar untuk akaun ini / Grand total for this account   11.00",
    ].join("\n");
    const { rows } = parse_pbe_card_statement(text);
    expect(rows).toHaveLength(11);
    expect(rows.every((r) => r.review_reasons.length === 0)).toBe(true);
    expect(rows[0]?.balance_after_major).toBe("11.00");
    pbe_card_validate(rows, "liability");
    expect(rows.filter((r) => r.status === "needs_review")).toEqual([]);
  });
});