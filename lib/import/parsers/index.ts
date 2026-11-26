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
import { parser_display_name } from "@/lib/import/import_labels";
import type { PdfDocMeta } from "@/lib/import/pdf_extract";
import { statement_detection_corpus } from "@/lib/import/statement_detection";
import type { ImportParsedAccount } from "@/lib/import/types";
import type { StatementParser } from "@/lib/import/parsers/types";

const PARSERS: StatementParser[] = [
  tng_text_parser,
  pbe_parser,
  hlb_parser,
  mbb_savings_parser,
  maybank_parser,
  mbb_card_parser,
  pbe_card_parser,
  generic_statement_parser(),
];

export function select_statement_parser(
  text: string,
  account_ref: string,
  pdf_meta?: PdfDocMeta | null,
): StatementParser {
  const corpus = statement_detection_corpus(text, pdf_meta);
  const biased = PARSERS.map((p) => {
    const result = p.detect(corpus);
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

function empty_parse_warning(parser_id: string): string {
  const label = parser_display_name(parser_id);
  return `${label} matched this file but no transaction rows were parsed. Check that the PDF has a selectable text layer and is the expected statement type.`;
}

export function parse_statement_text(
  text: string,
  account_ref: string,
  pdf_meta?: PdfDocMeta | null,
): {
  parser_id: string;
  rows: ReturnType<StatementParser["parse"]>;
  parse_warning: string | null;
  parsed_accounts?: ImportParsedAccount[];
} {
  const parser = select_statement_parser(text, account_ref, pdf_meta);
  if (parser.id === "pbe_card") {
    const result = parse_pbe_card_statement(text);
    const parse_warning =
      result.rows.length === 0
        ? (result.parse_warning ?? empty_parse_warning(parser.id))
        : result.parse_warning;
    return {
      parser_id: parser.id,
      rows: result.rows,
      parse_warning,
    };
  }
  if (parser.id === "mbb_card") {
    const result = parse_mbb_card_statement(text);
    const parse_warning =
      result.rows.length === 0
        ? (result.parse_warning ?? empty_parse_warning(parser.id))
        : result.parse_warning;
    return {
      parser_id: parser.id,
      rows: result.rows,
      parse_warning,
      parsed_accounts: result.accounts,
    };
  }
  if (parser.id === "mbb_savings") {
    const result = parse_mbb_savings_statement(text);
    const parse_warning =
      result.rows.length === 0
        ? (result.parse_warning ?? empty_parse_warning(parser.id))
        : result.parse_warning;
    return {
      parser_id: parser.id,
      rows: result.rows,
      parse_warning,
      parsed_accounts: result.account ? [result.account] : undefined,
    };
  }
  const rows = parser.parse(text);
  const parse_warning =
    rows.length === 0 && parser.id !== "generic"
      ? empty_parse_warning(parser.id)
      : null;
  return {
    parser_id: parser.id,
    rows,
    parse_warning,
  };
}