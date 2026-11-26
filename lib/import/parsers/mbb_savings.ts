import { account_config_by_ref } from "@/lib/accounts/registry";
import { parse_amount_cell, row_money_from_direction } from "@/lib/import/amount";
import type { ImportParsedAccount, NormalizedImportRow } from "@/lib/import/types";
import type { StatementParser } from "@/lib/import/parsers/types";

const ACCOUNT_REF = "MBB_SAVINGS";

const TXN_ROW_RE =
  /^(\d{1,2}\/\d{1,2})\s+(.+?)\s+([\d,]+\.\d{2})([+-])\s+([\d,]+\.\d{2})(?:\s+DR)?\s*$/i;

export type MbbSavingsStatementMeta = {
  statement_date_iso: string | null;
  statement_month: number | null;
  statement_year: number | null;
  opening_balance_major: string | null;
  ending_balance_major: string | null;
};

function expand_year_yy(yy: number): number {
  return yy >= 70 ? 1900 + yy : 2000 + yy;
}

function collapse_spaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function parse_mbb_savings_statement_date(text: string): {
  iso: string | null;
  month: number | null;
  year: number | null;
} {
  const match = text.match(
    /TARIKH\s+PENYATA[\s\S]{0,120}?(\d{1,2})\/(\d{1,2})\/(\d{2})\b/i,
  );
  if (!match) return { iso: null, month: null, year: null };
  const day = match[1].padStart(2, "0");
  const month = Number.parseInt(match[2], 10);
  const year = expand_year_yy(Number.parseInt(match[3], 10));
  if (month < 1 || month > 12) return { iso: null, month: null, year: null };
  const iso = `${year}-${String(month).padStart(2, "0")}-${day}`;
  return { iso, month, year };
}

function entry_date_to_iso(
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

function parse_signed_balance(balance_text: string, line: string): string {
  const major = parse_amount_cell(balance_text);
  if (/\s+DR\s*$/i.test(line.trim())) {
    return (-Number(major)).toFixed(2);
  }
  return major;
}

function is_header_or_footer_line(line: string): boolean {
  const upper = line.toUpperCase();
  if (!line.trim()) return true;
  if (/^PAGE\s+\d+/i.test(line)) return true;
  if (/^Maybank2u\.com$/i.test(line)) return true;
  if (/CURRENT ACCOUNT STATEMENT/i.test(line)) return true;
  if (/URUSNIAGA\s+AKAUN/i.test(line)) return true;
  if (/ACCOUNT\s+TRANSACTIONS/i.test(line)) return true;
  if (/ENTRY\s+DATE/i.test(line) && /VALUE\s+DATE/i.test(line)) return true;
  if (/^STATEMENT\s+BALANCE/i.test(line)) return true;
  if (/^TARIKH\s+PENYATA/i.test(line)) return true;
  if (/^BAKI\s+LEGAR/i.test(line)) return true;
  if (/^LEDGER\s+BALANCE/i.test(line)) return true;
  if (/^PERHATIAN/i.test(line) || /^NOTE\b/i.test(line)) return true;
  if (/PIDM/i.test(line)) return true;
  if (/^ENDING\s+BALANCE/i.test(line)) return true;
  if (/^BEGINNING\s+BALANCE/i.test(line)) return true;
  if (/MALAYAN\s+BANKING/i.test(upper)) return true;
  return false;
}

function is_dated_transaction_line(line: string): boolean {
  return /^\d{1,2}\/\d{1,2}\s+/.test(line.trim());
}

function txn_type_for_row(description: string, direction: "in" | "out"): string {
  const upper = description.toUpperCase();
  if (
    /MAYBANK\s+VISA\s+CARD/i.test(description) ||
    /AMERICAN\s+EXPRESS\s+CR/i.test(description)
  ) {
    return "cc_payment";
  }
  if (/TRANSFER\s+(TO|FR)\s+A\/C/i.test(upper)) {
    return "transfer";
  }
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
      temp_id: `mbb-sav-${item.parse_index}`,
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

export function parse_mbb_savings_statement(text: string): {
  rows: NormalizedImportRow[];
  meta: MbbSavingsStatementMeta;
  account: ImportParsedAccount | null;
  parse_warning: string | null;
} {
  const header = parse_mbb_savings_statement_date(text);
  const meta: MbbSavingsStatementMeta = {
    statement_date_iso: header.iso,
    statement_month: header.month,
    statement_year: header.year,
    opening_balance_major: null,
    ending_balance_major: null,
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

  const opening_match = text.match(/BEGINNING\s+BALANCE\s+([\d,]+\.\d{2})/i);
  if (opening_match) {
    meta.opening_balance_major = parse_amount_cell(opening_match[1]);
  }
  const ending_match = text.match(/ENDING\s+BALANCE\s+([\d,]+\.\d{2})/i);
  if (ending_match) {
    meta.ending_balance_major = parse_amount_cell(ending_match[1]);
  }

  const drafts: DraftTxn[] = [];
  const lines = text.split(/\r?\n/);
  let parse_index = 0;
  let pending_description: string[] = [];

  const append_pending_to_last = () => {
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
    const line = raw.replace(/\t/g, " ").trim();
    if (!line) continue;
    if (is_header_or_footer_line(line)) continue;

    const txn_match = line.match(TXN_ROW_RE);
    if (txn_match) {
      append_pending_to_last();
      const entry_date = txn_match[1];
      const type_text = txn_match[2].trim();
      const amount_major = parse_amount_cell(txn_match[3]);
      const sign = txn_match[4];
      const balance_major = parse_signed_balance(txn_match[5], line);
      const iso = entry_date_to_iso(entry_date, header.month, header.year);
      if (!iso) continue;
      const direction: "in" | "out" = sign === "+" ? "in" : "out";
      const description = collapse_spaces(type_text);
      drafts.push({
        parse_index: parse_index++,
        txn_at: `${iso}T00:00:00Z`,
        description,
        direction,
        amount_major,
        balance_after_major: balance_major,
        txn_type: txn_type_for_row(description, direction),
      });
      continue;
    }

    if (is_dated_transaction_line(line)) continue;

    if (drafts.length > 0) {
      pending_description.push(line.trim());
    }
  }
  append_pending_to_last();

  const rows = build_rows(drafts, account.account_id, ACCOUNT_REF);

  let running = Number(meta.opening_balance_major ?? "0");
  let credit_sum = 0;
  let debit_sum = 0;
  const chronological = [...drafts].sort((a, b) =>
    a.txn_at.localeCompare(b.txn_at),
  );
  for (const item of chronological) {
    const amt = Number(item.amount_major);
    if (item.direction === "in") {
      running += amt;
      credit_sum += amt;
    } else {
      running -= amt;
      debit_sum += amt;
    }
    const expected = running.toFixed(2);
    if (Math.abs(Number(item.balance_after_major) - Number(expected)) > 0.02) {
      mark_review(rows, "Running balance mismatch");
      break;
    }
  }

  if (meta.ending_balance_major != null && chronological.length > 0) {
    const last = chronological.at(-1)?.balance_after_major;
    const target = Number(meta.ending_balance_major);
    if (last != null && Math.abs(Number(last) - target) > 0.02) {
      mark_review(rows, "Ending balance mismatch");
    }
  }

  if (meta.opening_balance_major != null && meta.ending_balance_major != null) {
    const expected_close =
      Number(meta.opening_balance_major) + credit_sum - debit_sum;
    if (Math.abs(expected_close - Number(meta.ending_balance_major)) > 0.02) {
      mark_review(rows, "Opening to closing mismatch");
    }
  }

  let parse_warning: string | null = null;
  if (rows.length === 0) {
    parse_warning =
      "Account transactions section was found but no rows could be parsed.";
  }

  return { rows, meta, account, parse_warning };
}

export function mbb_savings_is_likely_statement(text: string): boolean {
  return detect_score(text) >= 0.55;
}

function detect_score(text: string): number {
  const upper = text.toUpperCase();
  let score = 0;
  if (upper.includes("STATEMENT OF CREDIT CARD ACCOUNT")) return 0;
  if (/CURRENT\s+ACCOUNT\s+STATEMENT/i.test(text)) score += 0.35;
  if (/URUSNIAGA\s+AKAUN/i.test(text)) score += 0.25;
  if (/ACCOUNT\s+TRANSACTIONS/i.test(text)) score += 0.2;
  if (/ENTRY\s+DATE/i.test(text) && /VALUE\s+DATE/i.test(text)) score += 0.15;
  if (text.toLowerCase().includes("maybank2u.com")) score += 0.1;
  if (/TARIKH\s+PENYATA/i.test(text)) score += 0.1;
  if (/BEGINNING\s+BALANCE/i.test(text)) score += 0.05;
  if (/^\s*\d{1,2}\/\d{1,2}\s+.+\d{2}[+-]\s+[\d,]+\.\d{2}/m.test(text)) {
    score += 0.1;
  }
  return Math.min(score, 0.99);
}

export const mbb_savings_parser: StatementParser = {
  id: "mbb_savings",
  detect(text: string) {
    return { id: "mbb_savings", score: detect_score(text) };
  },
  parse(text: string) {
    return parse_mbb_savings_statement(text).rows;
  },
};