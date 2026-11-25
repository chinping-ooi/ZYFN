import { generic_statement_parser } from "@/lib/import/parsers/generic";
import type { StatementParser } from "@/lib/import/parsers/types";

function keyword_parser(
  id: string,
  keywords: string[],
): StatementParser {
  const base = generic_statement_parser(id);
  return {
    id,
    detect(text: string) {
      const upper = text.toUpperCase();
      const keyword_hit = keywords.some((k) => upper.includes(k.toUpperCase()));
      const base_score = base.detect(text).score;
      return {
        id,
        score: base_score + (keyword_hit ? 0.45 : 0),
      };
    },
    parse: base.parse,
  };
}

export const pbe_parser = keyword_parser("pbe", ["PUBLIC BANK", "PBE"]);
export const maybank_parser = keyword_parser("maybank", ["MAYBANK", "MBB"]);
export const hlb_parser = keyword_parser("hlb", ["HONG LEONG", "HLB"]);
export const mbb_card_parser = keyword_parser("mbb_card", [
  "MAYBANK",
  "VISA",
  "AMEX",
]);
export const pbe_card_parser = keyword_parser("pbe_card", [
  "PUBLIC BANK",
  "VISA",
  "MASTERCARD",
]);