import { account_config_by_ref } from "@/lib/accounts/registry";
import {
  parse_amount_cell,
  row_money_from_direction,
} from "@/lib/import/institutions/mbb_card/amount";
import { scan_mbb_card_accounts_from_text } from "@/lib/import/institutions/mbb_card/product_scan";
import { parse_mbb_card_statement_header_date } from "@/lib/import/institutions/mbb_card/statement_date";
import type {
  ImportParsedAccount,
  NormalizedImportRow,
} from "@/lib/import/types";
import type { StatementParser } from "@/lib/import/parsers/types";

const PRODUCT_ACCOUNTS: Array<{
  pattern: RegExp;
  account_ref: string;
  account_id: number;
}> = [
  {
    pattern: /MAYBANK\s+2\s+GOLD\s+VISA/i,
    account_ref: "MBB_VISA_1697",
    account_id: 8,
  },
  {
    pattern: /MAYBANK\s+2\s+GOLD\s+AMEX/i,
    account_ref: "MBB_AMEX_8060",
    account_id: 9,
  },
];

export type MbbCardStatementMeta = {
  statement_date_iso: string | null;
  statement_month: number | null;
  statement_year: number | null;
};

/** Numeric parse index at the end of a temp id (string compare puts 10 before 9). */
function temp_id_index(temp_id: string): number {
  const match = temp_id.match(/(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function collapse_spaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export { parse_mbb_card_statement_header_date as parse_mbb_statement_header_date } from "@/lib/import/institutions/mbb_card/statement_date";

function account_for_product_line(line: string): (typeof PRODUCT_ACCOUNTS)[0] | null {
  for (const entry of PRODUCT_ACCOUNTS) {
    if (entry.pattern.test(line)) return entry;
  }
  return null;
}

function ddmm_to_iso(
  ddmm: string,
  statement_month: number,
  statement_year: number,
): string | null {
  const match = ddmm.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const txn_month = Number.parseInt(match[2], 10);
  if (txn_month < 1 || txn_month > 12) return null;
  const txn_year =
    txn_month > statement_month ? statement_year - 1 : statement_year;
  return `${txn_year}-${String(txn_month).padStart(2, "0")}-${day}`;
}

function format_posted_detail(posting_ddmm: string): string {
  const match = posting_ddmm.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return `Posted ${posting_ddmm}`;
  const month_names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const label = month_names[month - 1] ?? String(month);
  return `Posted ${day} ${label}`;
}

function txn_type_for_credit(description: string): string {
  if (/PYMT@MAYBANK2U\.COM/i.test(description)) return "cc_payment";
  if (/CASH\s+REBATE/i.test(description)) return "refund";
  return "refund";
}

function is_noise_line(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^PAGE\s+\d+/i.test(trimmed)) return true;
  if (/^STATEMENT OF CREDIT CARD ACCOUNT/i.test(trimmed)) return true;
  if (/^PENYATA AKAUN KAD KREDIT/i.test(trimmed)) return true;
  if (/^Malayan Banking Berhad/i.test(trimmed)) return true;
  if (/^Maybank2U\.com$/i.test(trimmed)) return true;
  if (/^Posting Date/i.test(trimmed)) return true;
  if (/^Transaction Date/i.test(trimmed)) return true;
  if (/^YOUR COMBINED CREDIT LIMIT/i.test(trimmed)) return true;
  if (/^TREATS\s*POINTS/i.test(trimmed)) return true;
  if (/^CARD\s+NO/i.test(trimmed)) return true;
  if (/^POINTS\b/i.test(trimmed)) return true;
  return false;
}

function skip_non_transaction(line: string): boolean {
  if (/RETAIL INTEREST RATE\s*=/i.test(line)) return true;
  if (/^TOTAL CREDIT THIS MONTH/i.test(line)) return true;
  if (/^TOTAL DEBIT THIS MONTH/i.test(line)) return true;
  return false;
}

type ParsedTxn = {
  posting: string;
  txn_date: string;
  description: string;
  amount_major: string;
  is_credit: boolean;
};

function parse_transaction_line(line: string): ParsedTxn | null {
  const normalized = line
    .replace(/\s+CR\s*$/i, " CR")
    .replace(/([\d,]+\.\d{2})\s*(CR)\s*$/i, "$1$2")
    .trim();
  if (skip_non_transaction(normalized)) return null;
  const amount_match = normalized.match(/([\d,]+\.\d{2})(CR)?\s*$/i);
  if (!amount_match) return null;
  const is_credit = Boolean(amount_match[2]);
  const amount_major = parse_amount_cell(amount_match[1]);
  const left = normalized.slice(0, amount_match.index).trim();
  const head = left.match(/^(\d{2}\/\d{2})\s+(\d{2}\/\d{2})\s+(.+)$/);
  if (!head) return null;
  const description = collapse_spaces(head[3]);
  if (!description) return null;
  return {
    posting: head[1],
    txn_date: head[2],
    description,
    amount_major,
    is_credit,
  };
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
  account_id: number;
  account_ref: string;
};

function assign_liability_balances(
  drafts: TxnDraft[],
  opening_major: string,
  account_id: number,
  account_ref: string,
  section_key: string,
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
    const balance_major =
      Math.abs(owed) < 0.005 ? "0.00" : owed.toFixed(2);
    const money = row_money_from_direction(
      item.direction,
      item.amount_major,
      balance_major,
    );
    with_balance.push({
      temp_id: `mbb-cc-${section_key}-${item.parse_index}`,
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
      account_id,
      account_ref,
    });
  }
  with_balance.sort((a, b) => {
    const by_date = b.txn_at.localeCompare(a.txn_at);
    if (by_date !== 0) return by_date;
    return temp_id_index(b.temp_id) - temp_id_index(a.temp_id);
  });
  return with_balance;
}

function parse_card_section(
  lines: string[],
  start: number,
  statement_month: number,
  statement_year: number,
  product: (typeof PRODUCT_ACCOUNTS)[0],
  section_key: string,
): {
  rows: NormalizedImportRow[];
  opening: string;
  closing: string | null;
  credit_total: number | null;
  debit_total: number | null;
  next_index: number;
} {
  let opening = "0.00";
  let credit_footer: string | null = null;
  let debit_footer: string | null = null;
  let closing: string | null = null;
  const drafts: TxnDraft[] = [];
  let index = 0;
  let i = start;
  for (; i < lines.length; i++) {
    const raw = lines[i].replace(/\t/g, " ");
    const line = raw.trim();
    if (!line) continue;
    if (i > start && account_for_product_line(line)) break;
    if (/TREATS\s*POINTS/i.test(line)) break;
    if (/^YOUR PREVIOUS STATEMENT BALANCE/i.test(line)) {
      const amt = line.match(/([\d,]+\.\d{2})\s*$/)?.[1];
      if (amt) opening = parse_amount_cell(amt);
      continue;
    }
    if (/^SUB TOTAL\/JUMLAH/i.test(line)) {
      const amt = line.match(/([\d,]+\.\d{2})\s*$/)?.[1];
      if (amt) closing = parse_amount_cell(amt);
      break;
    }
    if (/^TOTAL CREDIT THIS MONTH/i.test(line)) {
      credit_footer = line.match(/([\d,]+\.\d{2})\s*$/)?.[1] ?? null;
      continue;
    }
    if (/^TOTAL DEBIT THIS MONTH/i.test(line)) {
      debit_footer = line.match(/([\d,]+\.\d{2})\s*$/)?.[1] ?? null;
      continue;
    }
    if (is_noise_line(line)) continue;
    const txn = parse_transaction_line(line);
    if (!txn) continue;
    const iso = ddmm_to_iso(txn.txn_date, statement_month, statement_year);
    if (!iso) continue;
    const direction: "in" | "out" = txn.is_credit ? "in" : "out";
    const txn_type = txn.is_credit
      ? txn_type_for_credit(txn.description)
      : "purchase";
    drafts.push({
      parse_index: index++,
      txn_at: `${iso}T00:00:00Z`,
      posting: txn.posting,
      description: txn.description,
      direction,
      amount_major: txn.amount_major,
      txn_type,
      is_credit: txn.is_credit,
      account_id: product.account_id,
      account_ref: product.account_ref,
    });
  }
  const rows = assign_liability_balances(
    drafts,
    opening,
    product.account_id,
    product.account_ref,
    section_key,
  );
  let credit_sum = 0;
  let debit_sum = 0;
  for (const d of drafts) {
    const n = Number(d.amount_major);
    if (d.is_credit) credit_sum += n;
    else debit_sum += n;
  }
  const round2 = (n: number) => Math.round(n * 100) / 100;
  if (credit_footer != null) {
    const target = Number(parse_amount_cell(credit_footer));
    if (Math.abs(round2(credit_sum) - target) > 0.02) {
      for (const row of rows) {
        row.review_reasons.push("Statement credit total mismatch");
        if (row.status === "new") row.status = "needs_review";
      }
    }
  }
  if (debit_footer != null) {
    const target = Number(parse_amount_cell(debit_footer));
    if (Math.abs(round2(debit_sum) - target) > 0.02) {
      for (const row of rows) {
        row.review_reasons.push("Statement debit total mismatch");
        if (row.status === "new") row.status = "needs_review";
      }
    }
  }
  if (closing != null && rows.length > 0) {
    const chronological = [...rows].sort(
      (a, b) =>
        a.txn_at.localeCompare(b.txn_at) ||
        temp_id_index(a.temp_id) - temp_id_index(b.temp_id),
    );
    const last_balance = Number(
      chronological.at(-1)?.balance_after_major ?? "0",
    );
    if (Math.abs(last_balance - Number(closing)) > 0.02) {
      for (const row of rows) {
        row.review_reasons.push("Sub total mismatch");
        if (row.status === "new") row.status = "needs_review";
      }
    }
  }
  return {
    rows,
    opening,
    closing,
    credit_total: credit_footer ? Number(parse_amount_cell(credit_footer)) : null,
    debit_total: debit_footer ? Number(parse_amount_cell(debit_footer)) : null,
    next_index: i,
  };
}

export function parse_mbb_card_statement(text: string): {
  rows: NormalizedImportRow[];
  meta: MbbCardStatementMeta;
  accounts: ImportParsedAccount[];
  parse_warning: string | null;
} {
  const header = parse_mbb_card_statement_header_date(text);
  const meta: MbbCardStatementMeta = {
    statement_date_iso: header.iso,
    statement_month: header.month,
    statement_year: header.year,
  };
  const accounts: ImportParsedAccount[] = [];
  const all_rows: NormalizedImportRow[] = [];

  if (header.month == null || header.year == null) {
    const peek_accounts = scan_mbb_card_accounts_from_text(text);
    return {
      rows: [],
      meta,
      accounts: peek_accounts,
      parse_warning:
        peek_accounts.length > 0
          ? "Maybank card layout matched but statement date was not found in the PDF text."
          : null,
    };
  }

  const lines = text.split(/\r?\n/);
  let section = 0;
  for (let i = 0; i < lines.length; i++) {
  const line = lines[i].replace(/\t/g, " ").trim();
    const product = account_for_product_line(line);
    if (!product) continue;
    const config = account_config_by_ref(product.account_ref);
    const label = config?.account_label ?? product.account_ref;
    if (!accounts.some((a) => a.account_id === product.account_id)) {
      accounts.push({
        account_id: product.account_id,
        account_ref: product.account_ref,
        account_label: label,
      });
    }
    const parsed = parse_card_section(
      lines,
      i + 1,
      header.month,
      header.year,
      product,
      String(section++),
    );
    all_rows.push(...parsed.rows);
    i = parsed.next_index;
  }

  let parse_warning: string | null = null;
  if (accounts.length === 0) {
    parse_warning =
      "Maybank card layout was not recognized. Check that the PDF has selectable text.";
  } else if (all_rows.length === 0) {
    parse_warning =
      "Card sections were found but no transactions could be parsed.";
  }

  return { rows: all_rows, meta, accounts, parse_warning };
}

function detect_score(text: string): number {
  const upper = text.toUpperCase();
  let score = 0;
  if (upper.includes("STATEMENT OF CREDIT CARD ACCOUNT")) score += 0.45;
  if (upper.includes("PENYATA AKAUN KAD KREDIT")) score += 0.2;
  if (upper.includes("MALAYAN BANKING BERHAD")) score += 0.2;
  if (text.toLowerCase().includes("maybank2u.com")) score += 0.15;
  if (/Posting Date\s*\/\s*Transaction Date/i.test(text)) score += 0.15;
  if (/MAYBANK\s+2\s+GOLD\s+(?:VISA|AMEX)/i.test(text)) score += 0.1;
  return Math.min(score, 0.99);
}

export const mbb_card_parser: StatementParser = {
  id: "mbb_card",
  detect(text: string) {
    return { id: "mbb_card", score: detect_score(text) };
  },
  parse(text: string) {
    return parse_mbb_card_statement(text).rows;
  },
};

export function mbb_card_accounts_from_text(text: string): ImportParsedAccount[] {
  return parse_mbb_card_statement(text).accounts;
}