import {
  parse_amount_cell,
  row_money_from_direction,
} from "@/lib/import/institutions/pbe_card/amount";
import { parse_pbe_card_statement_header_date } from "@/lib/import/institutions/pbe_card/statement_date";
import { parse_pbe_card_statement_line } from "@/lib/import/institutions/pbe_card/statement_line";
import { pbe_savings_layout_score } from "@/lib/import/parsers/pbe_savings";
import type { NormalizedImportRow } from "@/lib/import/types";
import type { StatementParser } from "@/lib/import/parsers/types";

const MONTH_TO_NUM: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const LAST4_TO_ACCOUNT_REF: Record<string, string> = {
  "4104": "PBE_VISA_4104",
  "6357": "PBE_MASTERCARD_6357",
};

export type PbeCardStatementMeta = {
  statement_date_iso: string | null;
  statement_month: number | null;
  statement_year: number | null;
  card_last4: string | null;
  suggested_account_ref: string | null;
  opening_balance_major: string | null;
  month_total_credit_major: string | null;
  month_total_debit_major: string | null;
  grand_total_major: string | null;
};

function collapse_spaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function parse_dmy_with_year(
  day_month: string,
  statement_month: number,
  statement_year: number,
): string | null {
  const match = day_month.trim().match(/^(\d{1,2})\s+([A-Z]{3})$/i);
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const month_key = match[2].toUpperCase();
  const txn_month = MONTH_TO_NUM[month_key];
  if (!txn_month) return null;
  const txn_year =
    txn_month > statement_month ? statement_year - 1 : statement_year;
  const month = String(txn_month).padStart(2, "0");
  return `${txn_year}-${month}-${day}`;
}

export { parse_pbe_card_statement_header_date as parse_pbe_statement_header_date } from "@/lib/import/institutions/pbe_card/statement_date";

export function parse_pbe_card_last4(text: string): string | null {
  const card_line = text.match(
    /(?:MASTERCARD|VISA)[\s\S]{0,200}?\b\d{4}\s+\d{4}\s+\d{4}\s+(\d{4})\b/i,
  );
  if (card_line) return card_line[1];
  const tail = text.match(
    /(?:MASTERCARD|VISA)[^\n]*?\b(\d{4})\s*(?:CARDHOLDER|$)/im,
  );
  return tail?.[1] ?? null;
}

export function pbe_card_account_ref_from_last4(last4: string): string | null {
  return LAST4_TO_ACCOUNT_REF[last4] ?? null;
}

export function extract_pbe_card_meta(text: string): PbeCardStatementMeta {
  const { iso, month, year } = parse_pbe_card_statement_header_date(text);
  const last4 = parse_pbe_card_last4(text);
  return {
    statement_date_iso: iso,
    statement_month: month,
    statement_year: year,
    card_last4: last4,
    suggested_account_ref: last4
      ? pbe_card_account_ref_from_last4(last4)
      : null,
    opening_balance_major: null,
    month_total_credit_major: null,
    month_total_debit_major: null,
    grand_total_major: null,
  };
}

function is_noise_line(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^PAGE\s+\d+\s+OF\s+\d+$/i.test(trimmed)) return true;
  if (/^TARIKH PENYATA\b/i.test(trimmed) && !/STATEMENT DATE/i.test(trimmed)) {
    return true;
  }
  if (/^\d{6}\s+SN\d+/i.test(trimmed)) return true;
  if (/^PUBLIC BANK BERHAD$/i.test(trimmed)) return true;
  if (/^PENYATA KAD/i.test(trimmed)) return true;
  if (/pbebank\.com/i.test(trimmed)) return true;
  if (/^CARDHOLDER NAME$/i.test(trimmed)) return true;
  if (/^Post(?:ing)? Date\b/i.test(trimmed)) return true;
  return false;
}

function parse_footer_amounts(text: string): Partial<PbeCardStatementMeta> {
  const credit = text.match(/This month total credit\s+([\d,]+\.\d{2})/i)?.[1];
  const debit = text.match(/This month total debit\s+([\d,]+\.\d{2})/i)?.[1];
  const grand = text.match(
    /Grand total for this account\s+([\d,]+\.\d{2})/i,
  )?.[1];
  return {
    month_total_credit_major: credit ? parse_amount_cell(credit) : null,
    month_total_debit_major: debit ? parse_amount_cell(debit) : null,
    grand_total_major: grand ? parse_amount_cell(grand) : null,
  };
}

type ParsedLine = ReturnType<typeof parse_pbe_card_statement_line>;

function is_grand_total_line(line: string): boolean {
  return /grand\s+total/i.test(line) && /(account|akaun)/i.test(line);
}

function is_section_marker_line(line: string): boolean {
  const upper = line.toUpperCase();
  return (
    /MAKLUMAT\s+TRANSAKSI/i.test(upper) ||
    /TRANSACTION\s+DETAILS/i.test(upper)
  );
}

function txn_type_for_credit(description: string): string {
  if (/PAYMENT\s*-\s*THANK YOU/i.test(description)) return "cc_payment";
  return "refund";
}

function format_posted_detail(posting: string): string {
  const match = posting.trim().match(/^(\d{1,2})\s+([A-Za-z]{3})$/i);
  if (!match) return `Posted ${posting.trim()}`;
  const day = Number.parseInt(match[1], 10);
  const month =
    match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
  return `Posted ${day} ${month}`;
}

type TxnDraft = {
  parse_index: number;
  txn_at: string;
  posting: string;
  description: string;
  direction: "in" | "out";
  amount_major: string;
  txn_type: string;
  is_credit: boolean;
};

function assign_liability_balances(
  drafts: TxnDraft[],
  opening_major: string,
): NormalizedImportRow[] {
  const chronological = [...drafts].sort((a, b) => {
    const by_date = a.txn_at.localeCompare(b.txn_at);
    if (by_date !== 0) return by_date;
    return a.parse_index - b.parse_index;
  });
  let owed = Number(opening_major);
  const with_balance: NormalizedImportRow[] = [];
  for (const item of chronological) {
    const amt = Number(item.amount_major);
    if (item.is_credit) owed -= amt;
    else owed += amt;
    const balance_major = owed.toFixed(2);
    const money = row_money_from_direction(
      item.direction,
      item.amount_major,
      balance_major,
    );
    with_balance.push({
      temp_id: `pbe-cc-${item.parse_index}`,
      txn_at: item.txn_at,
      description: item.description,
      detail: format_posted_detail(item.posting),
      txn_type: item.txn_type,
      direction: item.direction,
      amount_major: item.amount_major,
      balance_after_major: balance_major,
      ...money,
      status: "new",
      review_reasons: [],
    });
  }
  with_balance.sort((a, b) => {
    const by_date = b.txn_at.localeCompare(a.txn_at);
    if (by_date !== 0) return by_date;
    return b.temp_id.localeCompare(a.temp_id);
  });
  return with_balance;
}

function mark_review(rows: NormalizedImportRow[], reason: string): void {
  for (const row of rows) {
    if (!row.review_reasons.includes(reason)) row.review_reasons.push(reason);
    if (row.status === "new") row.status = "needs_review";
  }
}

export function parse_pbe_card_statement(text: string): {
  rows: NormalizedImportRow[];
  meta: PbeCardStatementMeta;
  section_found: boolean;
  parse_warning: string | null;
} {
  const header = parse_pbe_card_statement_header_date(text);
  const footer = parse_footer_amounts(text);
  const meta: PbeCardStatementMeta = {
    ...extract_pbe_card_meta(text),
    ...footer,
    opening_balance_major: null,
  };

  if (header.month == null || header.year == null) {
    return {
      rows: [],
      meta,
      section_found: false,
      parse_warning: null,
    };
  }

  const lines = text.split(/\r?\n/);
  let in_section = false;
  let section_found = false;
  const parsed: NonNullable<ParsedLine>[] = [];

  for (const raw of lines) {
    const line = raw.replace(/\t/g, " ");
    if (is_section_marker_line(line)) {
      in_section = true;
      section_found = true;
      continue;
    }
    if (!in_section) continue;
    if (is_grand_total_line(line)) break;
    if (is_noise_line(line)) continue;
    const parsed_line = parse_pbe_card_statement_line(line);
    if (!parsed_line) continue;
    if (parsed_line.kind === "opening") {
      meta.opening_balance_major = parsed_line.amount_major;
      continue;
    }
    parsed.push(parsed_line);
  }

  const drafts: TxnDraft[] = [];
  let debit_sum = 0;
  let credit_sum = 0;
  let index = 0;

  for (const item of parsed) {
    if (item.kind !== "txn") continue;
    const iso = parse_dmy_with_year(
      item.txn_date,
      header.month,
      header.year,
    );
    if (!iso) continue;
    const direction: "in" | "out" = item.is_credit ? "in" : "out";
    const amt = Number(item.amount_major);
    if (item.is_credit) credit_sum += amt;
    else debit_sum += amt;
    const txn_type = item.is_credit
      ? txn_type_for_credit(item.description)
      : "purchase";
    drafts.push({
      parse_index: index++,
      txn_at: `${iso}T00:00:00Z`,
      posting: item.posting,
      description: item.description,
      direction,
      amount_major: item.amount_major,
      txn_type,
      is_credit: item.is_credit,
    });
  }

  const rows = assign_liability_balances(
    drafts,
    meta.opening_balance_major ?? "0.00",
  );

  const round2 = (n: number) => Math.round(n * 100) / 100;
  if (meta.month_total_credit_major != null) {
    const target = Number(meta.month_total_credit_major);
    if (Math.abs(round2(credit_sum) - target) > 0.02) {
      mark_review(rows, "Statement credit total mismatch");
    }
  }
  if (meta.month_total_debit_major != null) {
    const target = Number(meta.month_total_debit_major);
    if (Math.abs(round2(debit_sum) - target) > 0.02) {
      mark_review(rows, "Statement debit total mismatch");
    }
  }
  if (meta.grand_total_major != null && rows.length > 0) {
    const target = Number(meta.grand_total_major);
    const chronological_close = [...rows].sort((a, b) =>
      a.txn_at.localeCompare(b.txn_at),
    );
    const closing = Number(
      chronological_close.at(-1)?.balance_after_major ?? "0",
    );
    if (Math.abs(closing - target) > 0.02) {
      mark_review(rows, "Grand total mismatch");
    }
  }

  const txn_count = parsed.filter((p) => p.kind === "txn").length;
  let parse_warning: string | null = null;
  if (section_found && txn_count === 0) {
    parse_warning =
      "Transaction section was found but no rows could be parsed. The PDF text layout may not match the expected columns — try re-uploading or report this statement format.";
  }

  return { rows, meta, section_found, parse_warning };
}

function detect_score(text: string): number {
  if (pbe_savings_layout_score(text) >= 0.55) return 0.08;
  const upper = text.toUpperCase();
  let score = 0;
  if (
    upper.includes("PENYATA KAD") ||
    upper.includes("CARD STATEMENT")
  ) {
    score += 0.45;
  }
  if (upper.includes("PUBLIC BANK BERHAD")) score += 0.35;
  if (text.toLowerCase().includes("pbebank.com")) score += 0.15;
  if (
    upper.includes("TRANSACTION DETAILS") ||
    upper.includes("MAKLUMAT TRANSAKSI")
  ) {
    score += 0.1;
  }
  if (/(?:MASTERCARD|VISA)\s+(?:QUANTUM\s+)?\d{4}/i.test(text)) score += 0.1;
  return Math.min(score, 0.99);
}

export const pbe_card_parser: StatementParser = {
  id: "pbe_card",
  detect(text: string) {
    return { id: "pbe_card", score: detect_score(text) };
  },
  parse(text: string) {
    return parse_pbe_card_statement(text).rows;
  },
};