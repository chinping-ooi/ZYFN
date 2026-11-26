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
    const chron = [...rows].sort((a, b) => a.txn_at.localeCompare(b.txn_at));
    expect(chron.at(-1)?.balance_after_major).toBe("0.00");
  });

  it("computes balances by transaction date when statement order differs", () => {
    const text = [
      "PUBLIC BANK BERHAD",
      "PENYATA KAD / CARD STATEMENT",
      "Tarikh Penyata / Statement Date    16 NOV 2026",
      "MASTERCARD QUANTUM 1111 2222 3333 6357 CARDHOLDER",
      "Maklumat Transaksi / Transaction Details",
      " 17 OCT                     Previous Balance                         25.00",
      " 25 OCT    25 OCT           MR DIY STORE                           16.90",
      " 25 OCT    24 OCT           CTX CONVENIENCE                        50.00",
      " 01 NOV    01 NOV           PBeBANK PAYMENT - THANK YOU              91.90CR",
      "This month total credit   91.90",
      "This month total debit   66.90",
      "Jumlah besar untuk akaun ini / Grand total for this account   0.00",
    ].join("\n");
    const { rows } = parse_pbe_card_statement(text);
    expect(rows).toHaveLength(3);
    const by_date = [...rows].sort((a, b) => a.txn_at.localeCompare(b.txn_at));
    expect(by_date[0]?.balance_after_major).toBe("75.00");
    expect(by_date[1]?.balance_after_major).toBe("91.90");
    expect(by_date[2]?.balance_after_major).toBe("0.00");
    expect(rows.filter((r) => r.txn_type === "purchase")).toHaveLength(2);
    expect(rows.every((r) => r.status === "new")).toBe(true);
    expect(rows.every((r) => r.review_reasons.length === 0)).toBe(true);
    expect(rows.find((r) => r.description.includes("MR DIY"))?.detail).toBe(
      "Posted 25 Oct",
    );
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