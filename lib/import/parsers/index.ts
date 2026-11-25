import {
  hlb_parser,
  maybank_parser,
  mbb_card_parser,
  pbe_parser,
} from "@/lib/import/parsers/bank_stub";
import { pbe_card_parser } from "@/lib/import/parsers/pbe_card";
import { generic_statement_parser } from "@/lib/import/parsers/generic";
import { tng_text_parser } from "@/lib/import/parsers/tng";
import type { StatementParser } from "@/lib/import/parsers/types";

const PARSERS: StatementParser[] = [
  tng_text_parser,
  pbe_parser,
  maybank_parser,
  hlb_parser,
  mbb_card_parser,
  pbe_card_parser,
  generic_statement_parser(),
];

export function select_statement_parser(
  text: string,
  account_ref: string,
): StatementParser {
  const biased = PARSERS.map((p) => {
    const result = p.detect(text);
    if (
      (account_ref.includes("PBE_VISA") || account_ref.includes("PBE_MASTERCARD")) &&
      p.id === "pbe_card"
    ) {
      result.score += 0.25;
    } else if (account_ref.includes("PBE") && p.id.startsWith("pbe")) {
      result.score += 0.15;
    }
    if (account_ref.includes("MBB") && p.id.startsWith("mbb")) {
      result.score += 0.2;
    }
    if (account_ref === "HLB" && p.id === "hlb") result.score += 0.2;
    if (account_ref.includes("TNG") && p.id === "tng_text") result.score += 0.3;
    return { parser: p, ...result };
  });
  biased.sort((a, b) => b.score - a.score);
  return biased[0]?.parser ?? generic_statement_parser();
}

export function parse_statement_text(
  text: string,
  account_ref: string,
): { parser_id: string; rows: ReturnType<StatementParser["parse"]> } {
  const parser = select_statement_parser(text, account_ref);
  return { parser_id: parser.id, rows: parser.parse(text) };
}