import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  extract_pbe_card_meta,
  parse_pbe_card_statement,
  pbe_card_parser,
} from "@/lib/import/parsers/pbe_card";
import { select_statement_parser } from "@/lib/import/parsers";

const fixture_path = path.join(
  process.cwd(),
  "test/fixtures/import/pbe_card_statement_synthetic.txt",
);

function load_fixture(): string {
  return readFileSync(fixture_path, "utf8");
}

describe("pbe_card_parser", () => {
  it("detects Public Bank card statement PDF text", () => {
    const text = load_fixture();
    const { score } = pbe_card_parser.detect(text);
    expect(score).toBeGreaterThan(0.9);
    const selected = select_statement_parser(text, "PBE_MASTERCARD_6357");
    expect(selected.id).toBe("pbe_card");
  });

  it("parses transactions, CR payments, and Dec/Jan year rollover", () => {
    const { rows, meta, parse_warning } = parse_pbe_card_statement(load_fixture());
    expect(parse_warning).toBeNull();
    expect(meta.card_last4).toBe("6357");
    expect(meta.suggested_account_ref).toBe("PBE_MASTERCARD_6357");
    expect(meta.statement_date_iso).toBe("2027-01-16");
    expect(rows).toHaveLength(4);
    const dec_txn = rows.find((r) => r.description.includes("WINTER"));
    expect(dec_txn?.txn_at).toBe("2026-12-28T00:00:00Z");
    const payment = rows.find((r) => r.txn_type === "cc_payment");
    expect(payment?.direction).toBe("in");
    expect(payment?.amount_major).toBe("211.90");
    expect(rows.every((r) => r.status === "new")).toBe(true);
    expect(rows.at(-1)?.balance_after_major).toBe("0.00");
  });

  it("extracts header metadata without full card number", () => {
    const meta = extract_pbe_card_meta(load_fixture());
    expect(meta.card_last4).toBe("6357");
    expect(meta.statement_year).toBe(2027);
  });

  it("wins parser selection over generic stub", () => {
    const text = load_fixture();
    const generic = select_statement_parser(text, "PBE_SAVINGS");
    expect(generic.id).toBe("pbe_card");
  });
});