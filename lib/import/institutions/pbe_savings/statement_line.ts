import { parse_amount_cell } from "@/lib/import/institutions/pbe_savings/amount";

export type PbeSavingsSplitLine = {
  entry_date: string | null;
  description: string;
  txn_amount_major: string;
  balance_major: string;
};

const NON_TXN_MARKERS =
  /\bBalance\s+(?:B\/F|C\/F|From\s+Last\s+Statement)\b|Nombor\s+Akaun|Account\s+No\.?|Penyata\s+ini|Baki\s+Dari\s+Penyata/i;

const OPENING_LINE =
  /^\s*Balance\s+From\s+Last\s+Statement\b|^\s*Baki\s+Dari\s+Penyata\b/i;

function collapse_spaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function is_amount_token(token: string): boolean {
  return /^[\d,]+\.\d{2}$/.test(token.trim());
}

/** Reject glued account / reference digits masquerading as money. */
export function is_plausible_statement_amount(
  major: string,
  bounds: { opening: number | null; closing: number | null },
): boolean {
  const n = Number(major);
  if (!Number.isFinite(n) || n < 0) return false;
  const cap = Math.max(
    bounds.opening ?? 0,
    bounds.closing ?? 0,
    1_000_000,
    1,
  );
  if (n > cap * 50) return false;
  const raw = major.replace(/,/g, "");
  const [whole] = raw.split(".");
  if (whole && whole.length > 9) return false;
  if (whole && whole.length > 7 && !major.includes(",")) return false;
  return true;
}

export function is_non_transaction_line(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (OPENING_LINE.test(trimmed)) return true;
  if (NON_TXN_MARKERS.test(trimmed)) return true;
  return false;
}

function amounts_from_column_parts(
  parts: string[],
  bounds: { opening: number | null; closing: number | null },
): { txn: string; balance: string; desc_parts: string[] } | null {
  const amount_idx: number[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (is_amount_token(parts[i]!)) amount_idx.push(i);
  }
  if (amount_idx.length < 2) return null;

  const balance_idx = amount_idx.at(-1)!;
  const balance_raw = parts[balance_idx]!;
  const balance_major = parse_amount_cell(balance_raw);
  if (!is_plausible_statement_amount(balance_major, bounds)) return null;

  const txn_candidates: string[] = [];
  for (let i = amount_idx.length - 2; i >= 0; i--) {
    const idx = amount_idx[i]!;
    const major = parse_amount_cell(parts[idx]!);
    if (is_plausible_statement_amount(major, bounds)) {
      txn_candidates.push(major);
    }
    if (txn_candidates.length >= 2) break;
  }
  if (!txn_candidates.length) return null;

  const non_zero = txn_candidates.filter((m) => Math.abs(Number(m)) > 0.001);
  const txn_major =
    non_zero.at(-1) ?? txn_candidates[txn_candidates.length - 1]!;

  if (!is_plausible_statement_amount(txn_major, bounds)) return null;

  const first_amount = amount_idx[0]!;
  const desc_parts = parts.slice(0, first_amount);
  return { txn: txn_major, balance: balance_major, desc_parts };
}

function split_column_aware(
  body: string,
  bounds: { opening: number | null; closing: number | null },
): { txn: string; balance: string; description: string } | null {
  const parts = body
    .split(/\s{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const parsed = amounts_from_column_parts(parts, bounds);
  if (!parsed) return null;
  const description = collapse_spaces(parsed.desc_parts.join(" "));
  if (!description && txn_major_is_zero(parsed.txn)) return null;
  return {
    txn: parsed.txn,
    balance: parsed.balance,
    description,
  };
}

function txn_major_is_zero(major: string): boolean {
  return Math.abs(Number(major)) < 0.001;
}

function split_trailing_fallback(
  body: string,
  bounds: { opening: number | null; closing: number | null },
): { txn: string; balance: string; description: string } | null {
  const raw_amounts: string[] = [];
  let rest = body.trim();
  while (raw_amounts.length < 4) {
    const match = rest.match(/([\d,]+\.\d{2})\s*$/);
    if (!match || match.index == null) break;
    const major = parse_amount_cell(match[1]);
    if (!is_plausible_statement_amount(major, bounds)) break;
    raw_amounts.unshift(match[1]);
    rest = rest.slice(0, match.index).trimEnd();
  }
  if (raw_amounts.length < 2) return null;
  const balance_major = parse_amount_cell(raw_amounts.at(-1)!);
  const txn_major = parse_amount_cell(raw_amounts.at(-2)!);
  if (
    !is_plausible_statement_amount(balance_major, bounds) ||
    !is_plausible_statement_amount(txn_major, bounds)
  ) {
    return null;
  }
  let desc = rest;
  for (let i = 0; i < raw_amounts.length - 2; i++) {
    const m = desc.match(/([\d,]+\.\d{2})\s*$/);
    if (!m || m.index == null) break;
    const major = parse_amount_cell(m[1]);
    if (!is_plausible_statement_amount(major, bounds)) break;
    desc = desc.slice(0, m.index).trim();
  }
  const description = collapse_spaces(desc);
  if (!description && txn_major_is_zero(txn_major)) return null;
  return { txn: txn_major, balance: balance_major, description };
}

export function split_pbe_savings_statement_line(
  line: string,
  bounds: { opening: number | null; closing: number | null },
): PbeSavingsSplitLine | null {
  if (is_non_transaction_line(line)) return null;

  const date_match = line.match(/^(\d{1,2}\/\d{1,2})\s+(.*)$/);
  const entry_date = date_match?.[1] ?? null;
  const body = date_match?.[2] ?? line;

  if (is_non_transaction_line(body)) return null;

  const column = split_column_aware(body, bounds);
  const parsed = column ?? split_trailing_fallback(body, bounds);
  if (!parsed) return null;
  if (NON_TXN_MARKERS.test(parsed.description)) return null;

  return {
    entry_date,
    description: parsed.description,
    txn_amount_major: parsed.txn,
    balance_major: parsed.balance,
  };
}

/** Continuation text must not attach opening-balance headers. */
export function is_continuation_line(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^[\d,]+\.\d{2}$/.test(trimmed)) return false;
  if (is_non_transaction_line(trimmed)) return false;
  if (/^\d{1,2}\/\d{1,2}\s+/.test(trimmed)) return false;
  return true;
}