import { generic_statement_parser } from "@/lib/import/parsers/generic";
import { hlb_savings_layout_score } from "@/lib/import/parsers/hlb_savings";
import { mbb_savings_layout_score } from "@/lib/import/parsers/mbb_savings";
import { pbe_savings_layout_score } from "@/lib/import/parsers/pbe_savings";
import type { StatementParser } from "@/lib/import/parsers/types";

function keyword_parser(
  id: string,
  keywords: string[],
): StatementParser {
  const base = generic_statement_parser(id);
  return {
    id,
    detect(text: string) {
      if (id === "maybank" && mbb_savings_layout_score(text) >= 0.5) {
        return { id, score: 0.05 };
      }
      if (id === "pbe" && pbe_savings_layout_score(text) >= 0.5) {
        return { id, score: 0.05 };
      }
      if (id === "hlb" && hlb_savings_layout_score(text) >= 0.5) {
        return { id, score: 0.05 };
      }
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