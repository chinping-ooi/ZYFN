import {
  hlb_parser,
  maybank_parser,
  pbe_parser,
} from "@/lib/import/parsers/bank_stub";
import {
  mbb_card_parser,
  parse_mbb_card_statement,
} from "@/lib/import/parsers/mbb_card";
import {
  mbb_savings_parser,
  parse_mbb_savings_statement,
} from "@/lib/import/parsers/mbb_savings";
import {
  parse_pbe_card_statement,
  pbe_card_parser,
} from "@/lib/import/parsers/pbe_card";
import { generic_statement_parser } from "@/lib/import/parsers/generic";
import { tng_text_parser } from "@/lib/import/parsers/tng";
import type { ImportParsedAccount } from "@/lib/import/types";
import type { StatementParser } from "@/lib/import/parsers/types";

const PARSERS: StatementParser[] = [
  tng_text_parser,
  pbe_parser,
  maybank_parser,
  hlb_parser,
  mbb_savings_parser,
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
    if (
      account_ref.includes("MBB") &&
      (p.id.startsWith("mbb") || p.id === "mbb_card")
    ) {
      result.score += 0.2;
    }
    if (
      (account_ref.includes("MBB_VISA") || account_ref.includes("MBB_AMEX")) &&
      p.id === "mbb_card"
    ) {
      result.score += 0.25;
    }
    if (
      (account_ref === "MBB_SAVINGS" || account_ref.includes("MBB_SAVINGS")) &&
      p.id === "mbb_savings"
    ) {
      result.score += 0.25;
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
): {
  parser_id: string;
  rows: ReturnType<StatementParser["parse"]>;
  parse_warning: string | null;
  parsed_accounts?: ImportParsedAccount[];
} {
  const parser = select_statement_parser(text, account_ref);
  if (parser.id === "pbe_card") {
    const result = parse_pbe_card_statement(text);
    return {
      parser_id: parser.id,
      rows: result.rows,
      parse_warning: result.parse_warning,
    };
  }
  if (parser.id === "mbb_card") {
    const result = parse_mbb_card_statement(text);
    return {
      parser_id: parser.id,
      rows: result.rows,
      parse_warning: result.parse_warning,
      parsed_accounts: result.accounts,
    };
  }
  if (parser.id === "mbb_savings") {
    const result = parse_mbb_savings_statement(text);
    return {
      parser_id: parser.id,
      rows: result.rows,
      parse_warning: result.parse_warning,
      parsed_accounts: result.account ? [result.account] : undefined,
    };
  }
  return {
    parser_id: parser.id,
    rows: parser.parse(text),
    parse_warning: null,
  };
}