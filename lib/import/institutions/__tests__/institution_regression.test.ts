import { describe, expect, it } from "vitest";
import type { NormalizedImportRow } from "@/lib/import/types";
import { parse_amount_cell as hlb_parse } from "@/lib/import/institutions/hlb_savings/amount";
import { mark_duplicate_matches as hlb_dedupe } from "@/lib/import/institutions/hlb_savings/dedupe";
import { parse_amount_cell as mbb_savings_parse } from "@/lib/import/institutions/mbb_savings/amount";
import { mark_duplicate_matches as mbb_savings_dedupe } from "@/lib/import/institutions/mbb_savings/dedupe";
import { parse_amount_cell as mbb_card_parse } from "@/lib/import/institutions/mbb_card/amount";
import { mark_duplicate_matches as mbb_card_dedupe } from "@/lib/import/institutions/mbb_card/dedupe";
import { parse_amount_cell as pbe_savings_parse } from "@/lib/import/institutions/pbe_savings/amount";
import { mark_duplicate_matches as pbe_savings_dedupe } from "@/lib/import/institutions/pbe_savings/dedupe";
import { parse_amount_cell as pbe_card_parse } from "@/lib/import/institutions/pbe_card/amount";
import { mark_duplicate_matches as pbe_card_dedupe } from "@/lib/import/institutions/pbe_card/dedupe";
import { parse_amount_cell as spreadsheet_parse } from "@/lib/import/institutions/spreadsheet/amount";
import { mark_duplicate_matches as spreadsheet_dedupe } from "@/lib/import/institutions/spreadsheet/dedupe";
import { parse_amount_cell as tng_parse } from "@/lib/import/institutions/tng_wallet/amount";
import {
  type ExistingTxnForDedupe as TngExistingTxn,
  mark_duplicate_matches as tng_dedupe,
} from "@/lib/import/institutions/tng_wallet/dedupe";

function synthetic_row(
  partial: Partial<NormalizedImportRow>,
): NormalizedImportRow {
  return {
    temp_id: "synth-1",
    txn_at: "2025-06-01T00:00:00+08:00",
    description: "Sample merchant",
    detail: "",
    txn_type: "",
    direction: "out",
    amount_major: "10.00",
    balance_after_major: "90.00",
    in_sen: 0,
    out_sen: 1000,
    balance_sen: 9000,
    status: "new",
    review_reasons: [],
    account_ref: "HLB",
    ...partial,
  };
}

type InstitutionCase = {
  name: string;
  parse: typeof hlb_parse;
  dedupe: typeof hlb_dedupe;
  account_id?: number;
};

const CASES: InstitutionCase[] = [
  { name: "hlb_savings", parse: hlb_parse, dedupe: hlb_dedupe },
  {
    name: "mbb_savings",
    parse: mbb_savings_parse,
    dedupe: mbb_savings_dedupe,
  },
  { name: "mbb_card", parse: mbb_card_parse, dedupe: mbb_card_dedupe },
  {
    name: "pbe_savings",
    parse: pbe_savings_parse,
    dedupe: pbe_savings_dedupe,
  },
  { name: "pbe_card", parse: pbe_card_parse, dedupe: pbe_card_dedupe },
  {
    name: "spreadsheet",
    parse: spreadsheet_parse,
    dedupe: spreadsheet_dedupe,
  },
  {
    name: "tng_wallet",
    parse: tng_parse,
    dedupe: tng_dedupe,
    account_id: 4,
  },
];

describe("per-institution import formulas", () => {
  for (const { name, parse, dedupe, account_id } of CASES) {
    it(`${name}: parse_amount_cell and fuzzy dedupe on status new`, () => {
      expect(parse("1,234.56")).toBe("1234.56");
      const rows = [synthetic_row({ account_ref: name })];
      dedupe(
        rows,
        [
          {
            id: 1,
            txn_at: "2025-06-01T10:00:00+08:00",
            direction: "out",
            amount: "10.00",
            description: "SAMPLE MERCHANT",
            detail: null,
          },
        ],
        account_id,
      );
      if (name === "tng_wallet") {
        rows[0]!.status = "new";
        rows[0]!.review_reasons = [];
        rows[0]!.balance_after_major = "90.0000";
        const tng_existing: TngExistingTxn[] = [
          {
            id: 2,
            txn_at: "2025-06-01T00:00:00+08:00",
            direction: "out",
            amount: "10.0000",
            balance_after: "90.0000",
            description: "Different label",
            detail: null,
          },
        ];
        dedupe(rows, tng_existing, account_id);
        expect(rows[0]?.status).toBe("duplicate");
      } else {
        expect(rows[0]?.status).toBe("duplicate");
      }
    });
  }
});