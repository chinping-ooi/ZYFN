import { row_money_from_direction } from "@/lib/import/amount";
import type { NormalizedImportRow } from "@/lib/import/types";
import type { StatementParser } from "@/lib/import/parsers/types";
import { parse_tng_text } from "@/lib/tng/import/parse_text";
import { decimal_myr_to_sen } from "@/lib/supabase/decimal_to_sen";

export const tng_text_parser: StatementParser = {
  id: "tng_text",
  detect(text: string) {
    if (/TNG\s+WALLET\s+TRANSACTION\s+HISTORY/i.test(text)) {
      return { id: "tng_text", score: 0.15 };
    }
    const score =
      text.includes("TNG") || text.includes("GO+") || text.includes("eWallet")
        ? 0.85
        : 0;
    return { id: "tng_text", score };
  },
  parse(text: string): NormalizedImportRow[] {
    const dump = parse_tng_text(text);
    const rows: NormalizedImportRow[] = [];
    let index = 0;
    for (const row of dump.rows) {
      if (!row.affects_totals) continue;
      const direction: "in" | "out" =
        row.direction === "out" ? "out" : "in";
      const amount_micro =
        direction === "in" ? row.credit_micro : row.debit_micro;
      const amount_sen = decimal_myr_to_sen(String(amount_micro / 10_000));
      const amount_major = (amount_sen / 100).toFixed(4);
      const balance_major = (row.balance_micro / 10_000).toFixed(4);
      const money = row_money_from_direction(
        direction,
        amount_major,
        balance_major,
      );
      rows.push({
        temp_id: `tng-${index++}`,
        txn_at: `${row.date}T00:00:00Z`,
        description: row.description,
        detail: row.reference,
        txn_type: row.type,
        direction,
        amount_major,
        balance_after_major: balance_major,
        ...money,
        status: "new",
        review_reasons: [],
      });
    }
    return rows;
  },
};