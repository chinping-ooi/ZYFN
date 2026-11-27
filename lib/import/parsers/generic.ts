import {
  parse_amount_cell,
  row_money_from_direction,
} from "@/lib/import/institutions/spreadsheet/amount";
import type { NormalizedImportRow } from "@/lib/import/types";
import type { StatementParser } from "@/lib/import/parsers/types";

const LINE_PATTERN =
  /^(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})$/;

function normalize_pdf_date(raw: string): string {
  const dmy = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!dmy) return raw.slice(0, 10);
  const day = dmy[1].padStart(2, "0");
  const month = dmy[2].padStart(2, "0");
  let year = dmy[3];
  if (year.length === 2) year = `20${year}`;
  return `${year}-${month}-${day}`;
}

export function generic_statement_parser(id = "generic"): StatementParser {
  return {
    id,
    detect(text: string) {
      const hits = text.split("\n").filter((l) => LINE_PATTERN.test(l.trim())).length;
      return { id, score: hits > 0 ? 0.3 + Math.min(hits, 5) * 0.1 : 0 };
    },
    parse(text: string): NormalizedImportRow[] {
      const rows: NormalizedImportRow[] = [];
      let index = 0;
      for (const line of text.split("\n")) {
        const match = line.trim().match(LINE_PATTERN);
        if (!match) continue;
        const date = normalize_pdf_date(match[1]);
        const description = match[2].trim();
        const debit = parse_amount_cell(match[3]);
        const credit = parse_amount_cell(match[4]);
        const direction: "in" | "out" =
          Number(credit) > Number(debit) ? "in" : "out";
        const amount_major =
          direction === "in" ? credit || debit : debit || credit;
        const balance_major = credit || debit;
        const money = row_money_from_direction(direction, amount_major, balance_major);
        rows.push({
          temp_id: `pdf-${index++}`,
          txn_at: `${date}T00:00:00Z`,
          description,
          detail: "",
          txn_type: "",
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
}