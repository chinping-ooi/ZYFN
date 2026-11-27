import { parse_amount_cell } from "@/lib/import/institutions/pbe_card/amount";

export type PbeCardParsedLine =
  | { kind: "opening"; posting: string; amount_major: string }
  | {
      kind: "txn";
      posting: string;
      txn_date: string;
      description: string;
      amount_major: string;
      is_credit: boolean;
    };

function collapse_spaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalize_for_amount(line: string): string {
  return line
    .replace(/\t/g, " ")
    .replace(/([\d,]+\.\d{2})(CR)\b/gi, "$1 $2")
    .replace(/([\d,]+\.\d{2})CR\s*$/i, "$1 CR")
    .trim();
}

const DATE_TOKEN = /(\d{1,2}\s+[A-Za-z]{3})/i;

function date_from_part(part: string): string | null {
  const collapsed = collapse_spaces(part);
  const strict = collapsed.match(/^(\d{1,2}\s+[A-Za-z]{3})$/i);
  if (strict) return collapse_spaces(strict[1]!);
  const loose = collapsed.match(DATE_TOKEN)?.[1];
  return loose ? collapse_spaces(loose) : null;
}

function normalize_posting_date(value: string): string {
  return collapse_spaces(value);
}

function parse_by_columns(
  normalized: string,
  amount_major: string,
  is_credit: boolean,
  left: string,
): PbeCardParsedLine | null {
  if (/previous\s+balance/i.test(left)) {
    const post = date_from_part(left);
    if (!post) return null;
    return { kind: "opening", posting: post, amount_major };
  }

  const parts = left
    .split(/\s{3,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const posting = date_from_part(parts[0]!) ?? parts[0]!;
  let txn_date = posting;
  let desc_parts = parts.slice(1);
  if (desc_parts[0]) {
    const maybe_txn = date_from_part(desc_parts[0]!);
    if (maybe_txn) {
      txn_date = maybe_txn;
      desc_parts = desc_parts.slice(1);
    }
  }
  const description = collapse_spaces(desc_parts.join(" "));
  if (!description) return null;

  return {
    kind: "txn",
    posting: normalize_posting_date(posting),
    txn_date: normalize_posting_date(txn_date),
    description,
    amount_major,
    is_credit,
  };
}

function parse_compact_regex(
  normalized: string,
  amount_major: string,
  is_credit: boolean,
  left: string,
): PbeCardParsedLine | null {
  if (/previous\s+balance/i.test(left)) {
    const post = left.match(/^(\d{1,2}\s+[A-Za-z]{3})/i)?.[1];
    if (!post) return null;
    return { kind: "opening", posting: normalize_posting_date(post), amount_major };
  }
  const collapsed = collapse_spaces(left);
  const head = collapsed.match(
    /^(\d{1,2}\s+[A-Za-z]{3})(?:\s+(\d{1,2}\s+[A-Za-z]{3}))?\s+(.+)$/i,
  );
  if (!head) return null;
  return {
    kind: "txn",
    posting: normalize_posting_date(head[1]!),
    txn_date: normalize_posting_date(head[2] ?? head[1]!),
    description: collapse_spaces(head[3]!),
    amount_major,
    is_credit,
  };
}

export function parse_pbe_card_statement_line(line: string): PbeCardParsedLine | null {
  const normalized = normalize_for_amount(line);
  if (!normalized) return null;
  const amount_match = normalized.match(/([\d,]+\.\d{2})\s*(CR)?\s*$/i);
  if (!amount_match || amount_match.index == null) return null;
  const is_credit = Boolean(amount_match[2]);
  const amount_major = parse_amount_cell(amount_match[1]!);
  const left = normalized.slice(0, amount_match.index).trim();
  if (!left) return null;

  return (
    parse_by_columns(normalized, amount_major, is_credit, left) ??
    parse_compact_regex(normalized, amount_major, is_credit, left)
  );
}