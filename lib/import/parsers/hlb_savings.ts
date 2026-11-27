import { account_config_by_ref } from "@/lib/accounts/registry";
import {
  parse_amount_cell,
  row_money_from_direction,
} from "@/lib/import/institutions/hlb_savings/amount";
import {
  sort_hlb_ledger_drafts,
  stamp_hlb_ledger_txn_at,
} from "@/lib/import/institutions/hlb_savings/ledger_order";
import type { ImportParsedAccount, NormalizedImportRow } from "@/lib/import/types";
import type { StatementParser } from "@/lib/import/parsers/types";

const ACCOUNT_REF = "HLB";

export type HlbSavingsStatementMeta = {
  statement_date_iso: string | null;
  statement_month: number | null;
  statement_year: number | null;
  period_start_iso: string | null;
  period_end_iso: string | null;
  opening_balance_major: string | null;
  closing_balance_major: string | null;
  total_deposits_major: string | null;
  total_withdrawals_major: string | null;
  deposit_count: number | null;
  withdrawal_count: number | null;
};

type PageColumns = {
  deposit_col: number;
  withdrawal_col: number;
  balance_col: number;
};

type DraftTxn = {
  parse_index: number;
  txn_at: string;
  headline: string;
  detail_parts: string[];
  direction: "in" | "out";
  amount_major: string;
  printed_balance_major: string | null;
};

function collapse_spaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalize_pdfjs_line(line: string): string {
  return collapse_spaces(line.replace(/\u00a0/g, " "));
}

export function hlb_savings_layout_score(text: string): number {
  return detect_score(text);
}

export function hlb_savings_is_likely_statement(text: string): boolean {
  return detect_score(text) >= 0.48;
}

function detect_score(text: string): number {
  const upper = text.toUpperCase();
  let score = 0;
  if (/BASIC\s+SAVINGS/i.test(upper) && /\bACCOUNT\s+STATEMENT\b/i.test(upper)) {
    score += 0.35;
  } else if (
    /\bSAVINGS\b/i.test(upper) &&
    /\bACCOUNT\s+STATEMENT\b/i.test(upper)
  ) {
    score += 0.3;
  }
  if (/HONG\s+LEONG\s+BANK/i.test(upper)) score += 0.22;
  if (/CHECKFREE/i.test(upper)) score += 0.05;
  if (/BALANCE\s+FROM\s+PREVIOUS\s+STATEMENT/i.test(upper)) score += 0.12;
  if (/DEPOSIT/i.test(upper) && /WITHDRAWAL/i.test(upper)) score += 0.1;
  if (/TARIKH/i.test(upper) && /DESKRIPSI\s+TRANSAKSI/i.test(upper)) {
    score += 0.08;
  }
  if (/CLOSING\s+BALANCE|BAKI\s+AKHIR/i.test(upper)) score += 0.08;
  if (/^\s*\d{2}-\d{2}-\d{4}\s+/m.test(text)) score += 0.1;
  return Math.min(score, 0.99);
}

function parse_statement_dates(text: string): {
  statement_date_iso: string | null;
  statement_month: number | null;
  statement_year: number | null;
  period_start_iso: string | null;
  period_end_iso: string | null;
} {
  const statement =
    text.match(
      /(?:Date|Tarikh)\s*\/\s*(?:Tarikh|Date)?\s*:?\s*(\d{2})-(\d{2})-(\d{4})/i,
    ) ??
    text.match(/(?:Date|Tarikh)[\s\S]{0,80}?(\d{2})-(\d{2})-(\d{4})/i);
  const period = text.match(
    /Statement Period[\s\S]{0,80}?(\d{2})\/(\d{2})\/(\d{2})\s*-\s*(\d{2})\/(\d{2})\/(\d{2})/i,
  );
  let statement_date_iso: string | null = null;
  let statement_month: number | null = null;
  let statement_year: number | null = null;
  if (statement) {
    const day = statement[1];
    const month = Number.parseInt(statement[2], 10);
    const year = Number.parseInt(statement[3], 10);
    statement_month = month;
    statement_year = year;
    statement_date_iso = `${year}-${String(month).padStart(2, "0")}-${day}`;
  }
  let period_start_iso: string | null = null;
  let period_end_iso: string | null = null;
  if (period && statement_year != null) {
    const end_yy = Number.parseInt(period[6], 10);
    const end_year = end_yy >= 70 ? 1900 + end_yy : 2000 + end_yy;
    const start_yy = Number.parseInt(period[3], 10);
    const start_year = start_yy >= 70 ? 1900 + start_yy : 2000 + start_yy;
    period_start_iso = `${start_year}-${period[2].padStart(2, "0")}-${period[1].padStart(2, "0")}`;
    period_end_iso = `${end_year}-${period[5].padStart(2, "0")}-${period[4].padStart(2, "0")}`;
    if (statement_month == null) {
      statement_month = Number.parseInt(period[5], 10);
      statement_year = end_year;
    }
  }
  return {
    statement_date_iso,
    statement_month,
    statement_year,
    period_start_iso,
    period_end_iso,
  };
}

function dmy_dash_to_iso(
  ddmmyyyy: string,
  statement_month: number,
  statement_year: number,
): string | null {
  const match = ddmmyyyy.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const day = match[1];
  const txn_month = Number.parseInt(match[2], 10);
  const txn_year = Number.parseInt(match[3], 10);
  const year =
    txn_month > statement_month && txn_year === statement_year
      ? statement_year - 1
      : txn_year;
  return `${year}-${String(txn_month).padStart(2, "0")}-${day}`;
}

function parse_summary(text: string): Partial<HlbSavingsStatementMeta> {
  const opening = text.match(
    /Balance[\s\S]{0,60}?from[\s\S]{0,20}?previous[\s\S]{0,20}?statement\s+([\d,]+\.\d{2})/i,
  )?.[1];
  const closing = text.match(
    /(?:Closing Balance|Baki Akhir)\s*\/\s*(?:Baki Akhir|Closing Balance)?\s*:?\s*([\d,]+\.\d{2})/i,
  )?.[1];
  const dep_block = text.match(
    /(?:Total Deposits|Jumlah Simpanan)\s*\/\s*(?:Jumlah Simpanan|Total Deposits)?\s*:?\s*(\d+)\s+([\d,]+\.\d{2})/i,
  );
  const wit_block = text.match(
    /(?:Total Withdrawals|Jumlah Pengeluaran)\s*\/\s*(?:Jumlah Pengeluaran|Total Withdrawals)?\s*:?\s*(\d+)\s+([\d,]+\.\d{2})/i,
  );
  return {
    opening_balance_major: opening ? parse_amount_cell(opening) : null,
    closing_balance_major: closing ? parse_amount_cell(closing) : null,
    total_deposits_major: dep_block ? parse_amount_cell(dep_block[2]) : null,
    total_withdrawals_major: wit_block ? parse_amount_cell(wit_block[2]) : null,
    deposit_count: dep_block ? Number.parseInt(dep_block[1], 10) : null,
    withdrawal_count: wit_block ? Number.parseInt(wit_block[1], 10) : null,
  };
}

function detect_columns(line: string): PageColumns | null {
  if (!/\bDeposit\b|\bSimpanan\b/i.test(line)) return null;
  if (!/\bWithdrawal\b|\bPengeluaran\b/i.test(line)) return null;
  const deposit_col = line.search(/\bDeposit\b|\bSimpanan\b/i);
  const withdrawal_col = line.search(/\bWithdrawal\b|\bPengeluaran\b/i);
  const balance_hits = [...line.matchAll(/\bBalance\b|\bBaki\b/gi)];
  const balance_col = balance_hits.at(-1)?.index ?? -1;
  if (deposit_col < 0 || withdrawal_col < 0 || balance_col < 0) return null;
  if (deposit_col >= withdrawal_col || withdrawal_col >= balance_col) return null;
  return { deposit_col, withdrawal_col, balance_col };
}

function resolve_txn_amount(
  parsed: ParsedTxnLine,
  running: number,
): {
  direction: "in" | "out";
  amount_major: string;
  balance_major: string | null;
} {
  const bal = parsed.balance_major;
  const dep = parsed.deposit_major;
  const wit = parsed.withdrawal_major;
  if (dep && Number(dep) > 0 && (!wit || Number(wit) === 0)) {
    if (
      bal != null &&
      Math.abs(running + Number(dep) - Number(bal)) < 0.03
    ) {
      return { direction: "in", amount_major: dep, balance_major: bal };
    }
    if (bal == null) {
      if (headline_suggests_out(parsed.headline)) {
        return {
          direction: "out",
          amount_major: dep,
          balance_major: null,
        };
      }
      return { direction: "in", amount_major: dep, balance_major: null };
    }
  }
  if (wit && Number(wit) > 0 && (!dep || Number(dep) === 0)) {
    if (
      bal != null &&
      Math.abs(running - Number(wit) - Number(bal)) < 0.03
    ) {
      return { direction: "out", amount_major: wit, balance_major: bal };
    }
    if (bal == null) {
      return { direction: "out", amount_major: wit, balance_major: null };
    }
  }
  const try_out = wit ?? dep ?? "0.00";
  const try_in = dep ?? wit ?? "0.00";
  if (
    bal != null &&
    Math.abs(running - Number(try_out) - Number(bal)) < 0.03
  ) {
    return { direction: "out", amount_major: try_out, balance_major: bal };
  }
  if (
    bal != null &&
    Math.abs(running + Number(try_in) - Number(bal)) < 0.03
  ) {
    return { direction: "in", amount_major: try_in, balance_major: bal };
  }
  if (
    wit &&
    bal != null &&
    Math.abs(running - Number(wit) - Number(bal)) > 0.03 &&
    Math.abs(running + Number(wit) - Number(bal)) < 0.03
  ) {
    return { direction: "in", amount_major: wit, balance_major: bal };
  }
  if (wit && Number(wit) > 0) {
    return { direction: "out", amount_major: wit, balance_major: bal };
  }
  if (dep && Number(dep) > 0) {
    return { direction: "in", amount_major: dep, balance_major: bal };
  }
  return {
    direction: "out",
    amount_major: "0.00",
    balance_major: bal,
  };
}

function amount_hits(line: string): Array<{ start: number; major: string }> {
  const hits: Array<{ start: number; major: string }> = [];
  // Money cells only: not part of a longer number and not a percentage
  // (footer notices print rates like "N.NN% p.a." which are not amounts).
  for (const match of line.matchAll(/(?<![\d.,])([\d,]+\.\d{2})(?![\d%])/g)) {
    if (match.index == null) continue;
    hits.push({ start: match.index, major: parse_amount_cell(match[1]) });
  }
  return hits;
}

function classify_column(
  start: number,
  cols: PageColumns,
): "deposit" | "withdrawal" | "balance" | null {
  const options = [
    { kind: "deposit" as const, dist: Math.abs(start - cols.deposit_col) },
    { kind: "withdrawal" as const, dist: Math.abs(start - cols.withdrawal_col) },
    { kind: "balance" as const, dist: Math.abs(start - cols.balance_col) },
  ].sort((a, b) => a.dist - b.dist);
  if ((options[0]?.dist ?? 999) > 24) return null;
  return options[0]?.kind ?? null;
}

function is_noise_line(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  const upper = trimmed.toUpperCase();
  if (/^HONG\s+LEONG\s+BANK/i.test(trimmed)) return true;
  if (/^BASIC\s+SAVINGS/i.test(trimmed)) return true;
  if (/ACCOUNT\s+STATEMENT$/i.test(trimmed) && !/\d{2}-\d{2}-\d{4}/.test(trimmed)) {
    return true;
  }
  if (/^Page\s+No|^No\s+Mukasurat/i.test(trimmed)) return true;
  if (/^Date\s*\/\s*Tarikh/i.test(trimmed)) return true;
  if (/^Statement Period/i.test(trimmed)) return true;
  if (/^A\/C\s+No/i.test(trimmed) || /^Branch\b/i.test(trimmed)) return true;
  if (/^Tel\b/i.test(trimmed)) return true;
  if (/^Date\s+Transaction\s+Description/i.test(trimmed)) return true;
  if (/^Tarikh\s+Deskripsi/i.test(trimmed)) return true;
  if (/^Important Notices|^Notis Penting/i.test(trimmed)) return true;
  if (/^PIDM/i.test(trimmed)) return true;
  if (/^\d+_7\s+\d+$/.test(trimmed)) return true;
  if (/^\(\d+-\w\)$/.test(trimmed)) return true;
  if (/^Balance\s+C\/F|^Balance\s+B\/F/i.test(trimmed)) return true;
  if (/^Total Withdrawals|^Jumlah Pengeluaran/i.test(trimmed)) return true;
  if (/^Total Deposits|^Jumlah Simpanan/i.test(trimmed)) return true;
  if (/^Closing Balance|^Baki Akhir/i.test(trimmed) && !/\d{2}-\d{2}-\d{4}/.test(trimmed)) {
    return true;
  }
  if (/HIGHLIGHTS/i.test(upper) && !/\d{2}-\d{2}-\d{4}/.test(trimmed)) return true;
  return false;
}

function is_ledger_footer_start(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^Total Withdrawals|^Jumlah Pengeluaran/i.test(trimmed) ||
    /^Total Deposits|^Jumlah Simpanan/i.test(trimmed) ||
    /^Important Notices|^Notis Penting/i.test(trimmed)
  );
}

function headline_suggests_out(headline: string): boolean {
  return /DUITNOW|FPX|WITHDRAWAL|PENGELUARAN|COLLECTION/i.test(
    headline.toUpperCase(),
  );
}

function txn_type_for_row(
  headline: string,
  detail: string,
  direction: "in" | "out",
): string {
  const blob = `${headline} ${detail}`.toUpperCase();
  if (/DUITNOW\s+QR/i.test(blob)) return "payment";
  if (/FPX\s+COLLECTION/i.test(blob)) return "payment";
  if (/HLCONNECT\s+DUITNOW|FUND\s+TRANSFER/i.test(blob)) {
    return /OWN|SEL(?:F)?\s+PAY|HLB/i.test(blob) ? "transfer" : "payment";
  }
  return direction === "in" ? "receipt" : "payment";
}

function mark_review(rows: NormalizedImportRow[], reason: string): void {
  for (const row of rows) {
    if (!row.review_reasons.includes(reason)) row.review_reasons.push(reason);
    if (row.status === "new") row.status = "needs_review";
  }
}

type ParsedTxnLine = {
  date_token: string | null;
  headline: string;
  deposit_major: string | null;
  withdrawal_major: string | null;
  balance_major: string | null;
};

/**
 * Give an undated continuation line the running date without shifting its
 * columns: overwrite leading indentation when there is room.
 */
function with_date_prefix(raw_line: string, date_token: string): string {
  const indent = raw_line.length - raw_line.trimStart().length;
  if (indent >= date_token.length + 2) {
    return ` ${date_token}${raw_line.slice(date_token.length + 1)}`;
  }
  return `${date_token} ${raw_line.trimStart()}`;
}

function parse_txn_line(line: string, cols: PageColumns | null): ParsedTxnLine | null {
  const date_match = line.match(/^\s*(\d{2}-\d{2}-\d{4})\s+(.*)$/);
  const date_token = date_match?.[1] ?? null;
  const body = date_match?.[2] ?? line;
  const hits = amount_hits(body);
  if (hits.length === 0) return null;

  let deposit_major: string | null = null;
  let withdrawal_major: string | null = null;
  let balance_major: string | null = null;

  const body_offset = date_match ? line.indexOf(body) : 0;
  const txn_hit = hits.length >= 2 ? hits[hits.length - 2] : hits[0];
  const bal_hit = hits.length >= 2 ? hits.at(-1) : null;
  if (txn_hit) {
    let column_kind: ReturnType<typeof classify_column> = null;
    if (cols) {
      column_kind = classify_column(txn_hit.start + body_offset, cols);
    }
    if (column_kind === "deposit") deposit_major = txn_hit.major;
    else if (column_kind === "withdrawal") withdrawal_major = txn_hit.major;
    else if (column_kind === "balance" && hits.length === 1) {
      balance_major = txn_hit.major;
    } else if (column_kind === "balance" && hits.length >= 2) {
      deposit_major = txn_hit.major;
    } else {
      withdrawal_major = txn_hit.major;
    }
  }
  if (bal_hit) {
    balance_major = bal_hit.major;
  }
  if (hits.length >= 3) {
    const leading = hits.slice(0, hits.length - 2);
    for (const hit of leading) {
      if (cols) {
        const kind = classify_column(hit.start + body_offset, cols);
        if (kind === "deposit") deposit_major = hit.major;
        if (kind === "withdrawal") withdrawal_major = hit.major;
      }
    }
  }

  if (
    !deposit_major &&
    !withdrawal_major &&
    balance_major &&
    hits.length === 1
  ) {
    withdrawal_major = balance_major;
    balance_major = null;
  }
  if (!deposit_major && !withdrawal_major) return null;

  let desc = body;
  for (let i = 0; i < hits.length; i++) {
    const cut = desc.match(/\s*([\d,]+\.\d{2})\s*$/);
    if (!cut || cut.index == null) break;
    desc = desc.slice(0, cut.index).trimEnd();
  }
  const headline = collapse_spaces(desc) || "Transaction";

  if (
    deposit_major &&
    !withdrawal_major &&
    headline_suggests_out(headline)
  ) {
    withdrawal_major = deposit_major;
    deposit_major = null;
  }

  return {
    date_token,
    headline,
    deposit_major,
    withdrawal_major,
    balance_major,
  };
}

function build_rows(
  drafts: Array<
    DraftTxn & { computed_balance_major: string }
  >,
  account_id: number,
  account_ref: string,
): NormalizedImportRow[] {
  const newest_first = [...drafts].sort((a, b) => {
    const by_date = b.txn_at.slice(0, 10).localeCompare(a.txn_at.slice(0, 10));
    if (by_date !== 0) return by_date;
    return b.parse_index - a.parse_index;
  });
  return newest_first.map((item) => {
    const balance_major = item.computed_balance_major;
    const money = row_money_from_direction(
      item.direction,
      item.amount_major,
      balance_major,
    );
    const detail = collapse_spaces(item.detail_parts.join(" — "));
    return {
      temp_id: `hlb-sav-${item.parse_index}`,
      txn_at: item.txn_at,
      description: item.headline,
      detail,
      txn_type: txn_type_for_row(item.headline, detail, item.direction),
      direction: item.direction,
      amount_major: item.amount_major,
      balance_after_major: balance_major,
      ...money,
      status: "new" as const,
      review_reasons: [],
      account_id,
      account_ref,
    };
  });
}

export function parse_hlb_savings_statement(text: string): {
  rows: NormalizedImportRow[];
  meta: HlbSavingsStatementMeta;
  account: ImportParsedAccount | null;
  parse_warning: string | null;
} {
  const dates = parse_statement_dates(text);
  const summary = parse_summary(text);
  const meta: HlbSavingsStatementMeta = {
    statement_date_iso: dates.statement_date_iso,
    statement_month: dates.statement_month,
    statement_year: dates.statement_year,
    period_start_iso: dates.period_start_iso,
    period_end_iso: dates.period_end_iso,
    opening_balance_major: summary.opening_balance_major ?? null,
    closing_balance_major: summary.closing_balance_major ?? null,
    total_deposits_major: summary.total_deposits_major ?? null,
    total_withdrawals_major: summary.total_withdrawals_major ?? null,
    deposit_count: summary.deposit_count ?? null,
    withdrawal_count: summary.withdrawal_count ?? null,
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

  if (dates.statement_month == null || dates.statement_year == null || !account) {
    return { rows: [], meta, account: null, parse_warning: null };
  }

  const statement_month = dates.statement_month;
  const statement_year = dates.statement_year;

  const drafts: DraftTxn[] = [];
  // Keep the original spacing: column classification compares character
  // offsets of amounts with the header's Deposit/Withdrawal/Balance offsets,
  // which collapsing whitespace destroys (an aligned withdrawal then lands
  // nearest the Deposit header). Text checks use the collapsed form.
  const raw_lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\u00a0/g, " ").replace(/\s+$/, ""));
  let page_columns: PageColumns | null = null;
  let parse_index = 0;
  let last_date_token: string | null = null;
  let pending_detail: string[] = [];
  let open_draft: DraftTxn | null = null;
  let running_balance = Number(meta.opening_balance_major ?? "NaN");
  const running_for_parse = () =>
    Number.isFinite(running_balance)
      ? running_balance
      : Number(meta.opening_balance_major ?? 0);

  const flush_open = () => {
    if (!open_draft) {
      pending_detail = [];
      return;
    }
    if (pending_detail.length) {
      open_draft.detail_parts.push(...pending_detail);
      pending_detail = [];
    }
    drafts.push(open_draft);
    open_draft = null;
  };

  // The statement summary ("Total Withdrawals / Total Deposits") and the
  // "Important Notices" block close the ledger. Undated lines there must not
  // inherit the last transaction date, become rows, or be appended as detail.
  // A new column header (next page) re-opens the ledger.
  let in_footer = false;
  for (const raw_line of raw_lines) {
    const line = normalize_pdfjs_line(raw_line);
    if (!line) continue;
    const cols = detect_columns(raw_line);
    if (cols) {
      page_columns = cols;
      in_footer = false;
      continue;
    }
    if (is_ledger_footer_start(line)) {
      flush_open();
      in_footer = true;
      continue;
    }
    if (in_footer) continue;
    if (is_noise_line(line)) continue;

    if (/Balance[\s\S]{0,30}?from[\s\S]{0,20}?previous statement/i.test(line)) {
      const amt = line.match(/([\d,]+\.\d{2})\s*$/)?.[1];
      if (amt) meta.opening_balance_major = parse_amount_cell(amt);
      continue;
    }

    const parsed: ParsedTxnLine | null =
      parse_txn_line(raw_line, page_columns) ??
      (last_date_token
        ? parse_txn_line(
            with_date_prefix(raw_line, last_date_token),
            page_columns,
          )
        : null);

    if (!parsed) {
      if (open_draft) {
        pending_detail.push(line);
      } else if (drafts.length > 0) {
        drafts.at(-1)?.detail_parts.push(line);
      }
      continue;
    }

    if (parsed.date_token) last_date_token = parsed.date_token;
    const date_token = parsed.date_token ?? last_date_token;
    if (!date_token) continue;

    flush_open();

    const iso = dmy_dash_to_iso(date_token, statement_month, statement_year);
    if (!iso) continue;

    const resolved = resolve_txn_amount(parsed, running_for_parse());
    running_balance =
      resolved.balance_major != null
        ? Number(resolved.balance_major)
        : resolved.direction === "in"
          ? running_for_parse() + Number(resolved.amount_major)
          : running_for_parse() - Number(resolved.amount_major);

    open_draft = {
      parse_index: parse_index++,
      txn_at: `${iso}T00:00:00Z`,
      headline: parsed.headline,
      detail_parts: [],
      direction: resolved.direction,
      amount_major: resolved.amount_major,
      printed_balance_major: resolved.balance_major,
    };
  }
  flush_open();

  let running = Number(meta.opening_balance_major ?? "0");
  const enriched: Array<DraftTxn & { computed_balance_major: string }> = [];
  const chronological = sort_hlb_ledger_drafts(drafts);

  for (const item of chronological) {
    const amt = Number(item.amount_major);
    const next_running =
      item.direction === "in" ? running + amt : running - amt;
    const computed = next_running.toFixed(2);
    enriched.push({
      ...item,
      computed_balance_major:
        item.printed_balance_major ?? computed,
    });
    running =
      item.printed_balance_major != null
        ? Number(item.printed_balance_major)
        : next_running;
  }

  const ledger_order = sort_hlb_ledger_drafts(enriched);
  stamp_hlb_ledger_txn_at(ledger_order);
  const rows = build_rows(enriched, account.account_id, ACCOUNT_REF);

  let running_check = Number(meta.opening_balance_major ?? "0");
  for (const item of ledger_order) {
    const amt = Number(item.amount_major);
    const expected =
      item.direction === "in"
        ? running_check + amt
        : running_check - amt;
    if (
      item.printed_balance_major != null &&
      Math.abs(Number(item.printed_balance_major) - expected) > 0.02
    ) {
      mark_review(rows, "End-of-day balance mismatch");
    }
    running_check =
      item.printed_balance_major != null
        ? Number(item.printed_balance_major)
        : expected;
  }

  let credit_sum = 0;
  let debit_sum = 0;
  let credit_n = 0;
  let debit_n = 0;
  for (const item of chronological) {
    const amt = Number(item.amount_major);
    if (item.direction === "in") {
      credit_sum += amt;
      credit_n += 1;
    } else {
      debit_sum += amt;
      debit_n += 1;
    }
  }

  if (meta.closing_balance_major != null && enriched.length > 0) {
    const last = enriched.at(-1)?.computed_balance_major;
    if (
      last != null &&
      Math.abs(Number(last) - Number(meta.closing_balance_major)) > 0.02
    ) {
      mark_review(rows, "Closing balance mismatch");
    }
  }

  if (meta.opening_balance_major != null && meta.closing_balance_major != null) {
    const expected =
      Number(meta.opening_balance_major) + credit_sum - debit_sum;
    if (Math.abs(expected - Number(meta.closing_balance_major)) > 0.02) {
      mark_review(rows, "Opening to closing mismatch");
    }
  }

  if (meta.total_withdrawals_major != null) {
    if (Math.abs(debit_sum - Number(meta.total_withdrawals_major)) > 0.02) {
      mark_review(rows, "Withdrawal total mismatch");
    }
  }
  if (meta.total_deposits_major != null) {
    if (Math.abs(credit_sum - Number(meta.total_deposits_major)) > 0.02) {
      mark_review(rows, "Deposit total mismatch");
    }
  }
  if (meta.withdrawal_count != null && debit_n !== meta.withdrawal_count) {
    mark_review(rows, "Withdrawal count mismatch");
  }
  if (meta.deposit_count != null && credit_n !== meta.deposit_count) {
    mark_review(rows, "Deposit count mismatch");
  }

  let parse_warning: string | null = null;
  if (rows.length === 0 && /ACCOUNT STATEMENT/i.test(text)) {
    parse_warning =
      "Hong Leong savings layout was found but no transaction rows could be parsed.";
  }

  return { rows, meta, account, parse_warning };
}

export const hlb_savings_parser: StatementParser = {
  id: "hlb_savings",
  detect(text: string) {
    return { id: "hlb_savings", score: detect_score(text) };
  },
  parse(text: string) {
    return parse_hlb_savings_statement(text).rows;
  },
};