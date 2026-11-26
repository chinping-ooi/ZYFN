import { account_config_by_ref } from "@/lib/accounts/registry";
import { parse_amount_cell, row_money_from_direction } from "@/lib/import/amount";
import type { ImportParsedAccount, NormalizedImportRow } from "@/lib/import/types";
import type { StatementParser } from "@/lib/import/parsers/types";

const ACCOUNT_REF = "PBE_SAVINGS";

export type PbeSavingsStatementMeta = {
  statement_date_iso: string | null;
  statement_month: number | null;
  statement_year: number | null;
  opening_balance_major: string | null;
  closing_balance_major: string | null;
  total_debits_major: string | null;
  total_credits_major: string | null;
  debit_count: number | null;
  credit_count: number | null;
};

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

function collapse_spaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalize_pdfjs_line(line: string): string {
  return collapse_spaces(line.replace(/\u00a0/g, " "));
}

export function pbe_savings_layout_score(text: string): number {
  return detect_score(text);
}

export function pbe_savings_is_likely_statement(text: string): boolean {
  return detect_score(text) >= 0.48;
}

function detect_score(text: string): number {
  const upper = text.toUpperCase();
  if (
    upper.includes("PENYATA KAD") ||
    upper.includes("CARD STATEMENT") ||
    upper.includes("MAKLUMAT TRANSAKSI")
  ) {
    return 0;
  }
  let score = 0;
  if (
    upper.includes("PENYATA AKAUN") &&
    upper.includes("STATEMENT OF ACCOUNT")
  ) {
    score += 0.35;
  }
  if (upper.includes("PUBLIC BANK BERHAD")) score += 0.2;
  if (/SAVINGS\s+ACCT/i.test(upper) || /RM\s+CM\s+SAVINGS/i.test(upper)) {
    score += 0.2;
  }
  if (/TARIKH\s+URUS\s+NIAGA/i.test(upper) && /DEBIT\s+KREDIT/i.test(upper)) {
    score += 0.22;
  }
  if (/BALANCE\s+FROM\s+LAST\s+STATEMENT/i.test(upper)) score += 0.1;
  if (/JUMLAH\s+DEBIT|TOTAL\s+DEBITS/i.test(upper)) score += 0.08;
  if (/JUMLAH\s+KREDIT|TOTAL\s+CREDITS/i.test(upper)) score += 0.08;
  if (/\bBAKI\b/i.test(upper) && /\bPENUTUP|CLOSING/i.test(upper)) score += 0.05;
  if (text.toLowerCase().includes("public bank berhad")) score += 0.05;
  if (/^\s*\d{1,2}\/\d{1,2}\s+.+\d{2}\s+\d{2}/m.test(text)) score += 0.08;
  return Math.min(score, 0.99);
}

export function parse_pbe_savings_statement_date(text: string): {
  iso: string | null;
  month: number | null;
  year: number | null;
} {
  const match =
    text.match(
      /Statement\s+Date[\s\S]{0,200}?(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/i,
    ) ??
    text.match(
      /Tarikh\s+Penyata[\s\S]{0,200}?(\d{1,2})\s+([A-Z]{3})\s+(\d{4})/i,
    );
  if (!match) return { iso: null, month: null, year: null };
  const day = match[1].padStart(2, "0");
  const month_key = match[2].toUpperCase();
  const year = Number.parseInt(match[3], 10);
  const month = MONTH_TO_NUM[month_key];
  if (!month || !Number.isFinite(year)) return { iso: null, month: null, year: null };
  const iso = `${year}-${String(month).padStart(2, "0")}-${day}`;
  return { iso, month, year };
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

function parse_summary(text: string): Partial<PbeSavingsStatementMeta> {
  const closing =
    text.match(
      /(?:Baki Penutup|Closing Balance)[\s/]*(?:Closing Balance)?\s+([\d,]+\.\d{2})/i,
    )?.[1] ??
    text.match(/Closing Balance In This Statement\s+([\d,]+\.\d{2})/i)?.[1];
  const debits = text.match(
    /(?:Jumlah Debit|Total Debits)\s+([\d,]+\.\d{2})/i,
  )?.[1];
  const credits = text.match(
    /(?:Jumlah Kredit|Total Credits)\s+([\d,]+\.\d{2})/i,
  )?.[1];
  const debit_count = text.match(
    /(?:Bil\.\s*Debit|No\.\s*of Debits)\s+(\d+)/i,
  )?.[1];
  const credit_count = text.match(
    /(?:Bil\.\s*Kredit|No\.\s*of Credits)\s+(\d+)/i,
  )?.[1];
  const opening =
    text.match(
      /Balance[\s\S]{0,60}?Last[\s\S]{0,30}?Statement\s+([\d,]+\.\d{2})/i,
    )?.[1] ??
    text.match(
      /Balance[\s\S]{0,60}?Last[\s\S]{0,30}?Statement[\s\n]+([\d,]+\.\d{2})/i,
    )?.[1];
  return {
    opening_balance_major: opening ? parse_amount_cell(opening) : null,
    closing_balance_major: closing ? parse_amount_cell(closing) : null,
    total_debits_major: debits ? parse_amount_cell(debits) : null,
    total_credits_major: credits ? parse_amount_cell(credits) : null,
    debit_count: debit_count != null ? Number.parseInt(debit_count, 10) : null,
    credit_count: credit_count != null ? Number.parseInt(credit_count, 10) : null,
  };
}

function is_noise_line(line: string): boolean {
  const upper = line.toUpperCase();
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^PUBLIC BANK BERHAD$/i.test(trimmed)) return true;
  if (/^PENYATA AKAUN/i.test(trimmed)) return true;
  if (/^STATEMENT OF ACCOUNT$/i.test(trimmed)) return true;
  if (/^Jenis Akaun/i.test(trimmed) || /^Account Type/i.test(trimmed)) return true;
  if (/^Tarikh Penyata/i.test(trimmed) || /^Statement Date/i.test(trimmed)) return true;
  if (/^TARIKH\s+URUS/i.test(trimmed) && /DEBIT\s+KREDIT/i.test(trimmed)) {
    return true;
  }
  if (/^DATE\s+TRANSACTION/i.test(trimmed)) return true;
  if (/^Muka Surat/i.test(trimmed) || /^Page\s+\d+\s+of/i.test(trimmed)) return true;
  if (/^PIDM/i.test(trimmed)) return true;
  if (/^Balance\s+C\/F/i.test(trimmed) || /^Balance\s+B\/F/i.test(trimmed)) {
    return true;
  }
  if (/^Closing Balance In This Statement/i.test(trimmed)) return true;
  if (/^Balance From Last Statement$/i.test(trimmed)) return true;
  if (/Penyata ini dicetak/i.test(trimmed)) return true;
  if (/Baki Harian Dan Penutup/i.test(trimmed)) return true;
  if (/Thank You For Banking/i.test(trimmed)) return true;
  if (/Privacy Notice/i.test(trimmed)) return true;
  if (/^PERHATIAN/i.test(trimmed) || /^ATTENTION/i.test(trimmed)) return true;
  if (/HIGHLIGHTS/i.test(trimmed) && !/\d{1,2}\/\d{1,2}/.test(trimmed)) {
    return true;
  }
  if (/Baki Penutup/i.test(trimmed) && /Closing Balance/i.test(trimmed)) {
    return true;
  }
  if (/Jumlah Debit|Total Debits/i.test(trimmed) && !/\d{1,2}\/\d{1,2}/.test(trimmed)) {
    return true;
  }
  if (/Jumlah Kredit|Total Credits/i.test(trimmed) && !/\d{1,2}\/\d{1,2}/.test(trimmed)) {
    return true;
  }
  if (/Bil\.\s*Debit|No\.\s*of Debits/i.test(trimmed)) return true;
  if (/Bil\.\s*Kredit|No\.\s*of Credits/i.test(trimmed)) return true;
  if (/^\d{12,}\s*$/.test(trimmed)) return true;
  if (/PBE BANK/i.test(upper) && !/\d{1,2}\/\d{1,2}/.test(trimmed)) return true;
  return false;
}

function trailing_amounts_raw(line: string): string[] {
  const found: string[] = [];
  let rest = line.trim();
  while (true) {
    const match = rest.match(/([\d,]+\.\d{2})\s*$/);
    if (!match || match.index == null) break;
    found.unshift(match[1]);
    rest = rest.slice(0, match.index).trimEnd();
  }
  return found;
}

type SplitLine = {
  entry_date: string | null;
  description: string;
  txn_amount_major: string;
  balance_major: string;
};

function split_transaction_line(line: string): SplitLine | null {
  const date_match = line.match(/^(\d{1,2}\/\d{1,2})\s+(.*)$/);
  const entry_date = date_match?.[1] ?? null;
  const body = date_match?.[2] ?? line;
  const raw_amounts = trailing_amounts_raw(body);
  if (raw_amounts.length < 2) return null;
  const balance_major = parse_amount_cell(raw_amounts.at(-1)!);
  const txn_amount_major = parse_amount_cell(raw_amounts.at(-2)!);
  let desc = body;
  for (let i = 0; i < 2; i++) {
    const m = desc.match(/([\d,]+\.\d{2})\s*$/);
    if (!m || m.index == null) return null;
    desc = desc.slice(0, m.index).trim();
  }
  const description = collapse_spaces(desc);
  if (!description && txn_amount_major === "0.00") {
    return null;
  }
  return {
    entry_date,
    description,
    txn_amount_major,
    balance_major,
  };
}

function direction_from_balances(
  prev: number,
  amount: number,
  next: number,
): "in" | "out" | null {
  if (Math.abs(prev - amount - next) < 0.021) return "out";
  if (Math.abs(prev + amount - next) < 0.021) return "in";
  return null;
}

function txn_type_for_row(description: string, direction: "in" | "out"): string {
  const upper = description.toUpperCase();
  if (/CR\s+CARD\s+PYMT|CARD\s+PYMT/i.test(upper)) return "cc_payment";
  if (/HANDLING\s+CHRG|ANNUAL\s+FEE|\bSST\b/i.test(upper)) return "fee";
  if (/DUITNOW\s+TRSF|DR-ECP|\bFPX\b/i.test(upper)) return "transfer";
  if (/DUITNOW\s+QR/i.test(upper) && direction === "out") return "payment";
  return direction === "in" ? "receipt" : "payment";
}

function mark_review(rows: NormalizedImportRow[], reason: string): void {
  for (const row of rows) {
    if (!row.review_reasons.includes(reason)) row.review_reasons.push(reason);
    if (row.status === "new") row.status = "needs_review";
  }
}

type DraftTxn = {
  parse_index: number;
  txn_at: string;
  description: string;
  direction: "in" | "out";
  amount_major: string;
  balance_after_major: string;
  txn_type: string;
};

function build_rows(
  drafts: DraftTxn[],
  account_id: number,
  account_ref: string,
): NormalizedImportRow[] {
  const newest_first = [...drafts].sort((a, b) => {
    const by_date = b.txn_at.localeCompare(a.txn_at);
    if (by_date !== 0) return by_date;
    return b.parse_index - a.parse_index;
  });
  return newest_first.map((item) => {
    const money = row_money_from_direction(
      item.direction,
      item.amount_major,
      item.balance_after_major,
    );
    return {
      temp_id: `pbe-sav-${item.parse_index}`,
      txn_at: item.txn_at,
      description: item.description,
      detail: "",
      txn_type: item.txn_type,
      direction: item.direction,
      amount_major: item.amount_major,
      balance_after_major: item.balance_after_major,
      ...money,
      status: "new" as const,
      review_reasons: [],
      account_id,
      account_ref,
    };
  });
}

export function parse_pbe_savings_statement(text: string): {
  rows: NormalizedImportRow[];
  meta: PbeSavingsStatementMeta;
  account: ImportParsedAccount | null;
  parse_warning: string | null;
} {
  const header = parse_pbe_savings_statement_date(text);
  const summary = parse_summary(text);
  const meta: PbeSavingsStatementMeta = {
    statement_date_iso: header.iso,
    statement_month: header.month,
    statement_year: header.year,
    opening_balance_major: summary.opening_balance_major ?? null,
    closing_balance_major: summary.closing_balance_major ?? null,
    total_debits_major: summary.total_debits_major ?? null,
    total_credits_major: summary.total_credits_major ?? null,
    debit_count: summary.debit_count ?? null,
    credit_count: summary.credit_count ?? null,
  };

  const config = account_config_by_ref(ACCOUNT_REF);
  const account: ImportParsedAccount | null =
    config?.account_id != null
      ? {
          account_id: config.account_id,
          account_ref: ACCOUNT_REF,
          account_label: config.account_label,
        }
      : null;

  if (header.month == null || header.year == null || !account) {
    return { rows: [], meta, account: null, parse_warning: null };
  }
  const statement_month = header.month;
  const statement_year = header.year;

  const drafts: DraftTxn[] = [];
  const lines = text.split(/\r?\n/).map(normalize_pdfjs_line);
  let parse_index = 0;
  let last_entry_date: string | null = null;
  let pending_description: string[] = [];
  let running_balance = Number(meta.opening_balance_major ?? "NaN");

  const flush_pending = () => {
    if (!pending_description.length || drafts.length === 0) {
      pending_description = [];
      return;
    }
    const last = drafts.at(-1);
    if (!last) return;
    const extra = collapse_spaces(pending_description.join(" "));
    pending_description = [];
    last.description = collapse_spaces(`${last.description} — ${extra}`);
    last.txn_type = txn_type_for_row(last.description, last.direction);
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (is_noise_line(line)) continue;

    const split = split_transaction_line(line);
    if (!split) {
      if (drafts.length > 0 && !/^[\d,]+\.\d{2}$/.test(line)) {
        pending_description.push(line);
      }
      continue;
    }

    if (split.entry_date) last_entry_date = split.entry_date;
    const entry_date = split.entry_date ?? last_entry_date;
    if (!entry_date) continue;

    flush_pending();

    const iso = ddmm_to_iso(entry_date, statement_month, statement_year);
    if (!iso) continue;

    const amount_num = Number(split.txn_amount_major);
    const balance_num = Number(split.balance_major);
    let direction: "in" | "out" = "out";
    if (Number.isFinite(running_balance)) {
      const inferred = direction_from_balances(
        running_balance,
        amount_num,
        balance_num,
      );
      direction =
        inferred ?? (amount_num === 0 ? "out" : "out");
    }
    running_balance = balance_num;

    drafts.push({
      parse_index: parse_index++,
      txn_at: `${iso}T00:00:00Z`,
      description: split.description,
      direction,
      amount_major: split.txn_amount_major,
      balance_after_major: split.balance_major,
      txn_type: txn_type_for_row(split.description, direction),
    });
  }
  flush_pending();

  const rows = build_rows(drafts, account.account_id, ACCOUNT_REF);

  let debit_sum = 0;
  let credit_sum = 0;
  let debit_rows = 0;
  let credit_rows = 0;
  const chronological = [...drafts].sort((a, b) =>
    a.txn_at.localeCompare(b.txn_at),
  );
  let running = Number(meta.opening_balance_major ?? "0");
  for (const item of chronological) {
    const amt = Number(item.amount_major);
    if (item.direction === "in") {
      running += amt;
      credit_sum += amt;
      credit_rows += 1;
    } else {
      running -= amt;
      debit_sum += amt;
      debit_rows += 1;
    }
    const expected = running.toFixed(2);
    if (Math.abs(Number(item.balance_after_major) - Number(expected)) > 0.02) {
      mark_review(rows, "Running balance mismatch");
      break;
    }
  }

  if (meta.closing_balance_major != null && chronological.length > 0) {
    const last_bal = chronological.at(-1)?.balance_after_major;
    if (
      last_bal != null &&
      Math.abs(Number(last_bal) - Number(meta.closing_balance_major)) > 0.02
    ) {
      mark_review(rows, "Closing balance mismatch");
    }
  }

  if (meta.opening_balance_major != null && meta.closing_balance_major != null) {
    const expected_close =
      Number(meta.opening_balance_major) + credit_sum - debit_sum;
    if (Math.abs(expected_close - Number(meta.closing_balance_major)) > 0.02) {
      mark_review(rows, "Opening to closing mismatch");
    }
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  if (meta.total_debits_major != null) {
    if (Math.abs(round2(debit_sum) - Number(meta.total_debits_major)) > 0.02) {
      mark_review(rows, "Statement debit total mismatch");
    }
  }
  if (meta.total_credits_major != null) {
    if (Math.abs(round2(credit_sum) - Number(meta.total_credits_major)) > 0.02) {
      mark_review(rows, "Statement credit total mismatch");
    }
  }
  if (meta.debit_count != null && debit_rows !== meta.debit_count) {
    mark_review(rows, "Debit count mismatch");
  }
  if (meta.credit_count != null && credit_rows !== meta.credit_count) {
    mark_review(rows, "Credit count mismatch");
  }

  let parse_warning: string | null = null;
  if (
    rows.length === 0 &&
    /STATEMENT OF ACCOUNT|PENYATA AKAUN/i.test(text)
  ) {
    parse_warning =
      "Public Bank savings layout was found but no transaction rows could be parsed.";
  }

  return { rows, meta, account, parse_warning };
}

export const pbe_savings_parser: StatementParser = {
  id: "pbe_savings",
  detect(text: string) {
    return { id: "pbe_savings", score: detect_score(text) };
  },
  parse(text: string) {
    return parse_pbe_savings_statement(text).rows;
  },
};