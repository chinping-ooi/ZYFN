import { account_config_by_ref } from "@/lib/accounts/registry";
import { row_money_from_direction } from "@/lib/import/institutions/tng_wallet/amount";
import type { ImportParsedAccount, NormalizedImportRow } from "@/lib/import/types";
import type { StatementParser } from "@/lib/import/parsers/types";
import { classify_tng_direction } from "@/lib/tng/import/direction";
import { parse_tng_dump_date } from "@/lib/tng/import/date_parse";
import { normalize_tng_type } from "@/lib/tng/import/normalize_type";
import {
  display_dp_for_account,
  format_micro_major_precise,
  major_text_to_micro,
  type MicroAmount,
} from "@/lib/tng/money_micro";
import type { TngAccount } from "@/lib/tng/import/types";

const WALLET_CFG = account_config_by_ref("TNG_EWALLET")!;
const GO_CFG = account_config_by_ref("TNG_GO_PLUS")!;

const DISCLAIMER = [
  "system generated email",
  "do not reply",
  "further enquiry",
  "operating hours",
  "including public holidays",
  "thank you.",
  "5022 3888",
];

const RECORD_START =
  /^\d{1,2}\/\d{1,2}\/\d{4}\s+(Success|Pending|Failed)/i;

const RM_PAIR_END = /RM\s?([\d,.]+)\s+RM\s?([\d,.]+)\s*$/i;

const RFID_DETAIL_TIME =
  /(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i;

const SKIP_LINE =
  /^(TNG WALLET TRANSACTION HISTORY|Registered Name|Wallet ID|Account Status|Generated Date|Transaction Period|Date\s+Status|Amount\s*\(RM\)|Wallet Balance|GO\+\s*Balance|TNG WALLET TRANSACTION|GO\+\s*TRANSACTION)\b/i;

type LedgerDraft = {
  parse_index: number;
  section: TngAccount;
  date_iso: string;
  txn_at: string;
  status: string;
  raw_type: string;
  normalized_type: string;
  reference: string;
  description: string;
  direction: "in" | "out";
  amount_micro: MicroAmount;
  balance_micro: MicroAmount;
  affects_totals: boolean;
  derived: boolean;
  review_reasons: string[];
};

function collapse_spaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalize_tng_wallet_pdf_line(line: string): string {
  const spaced = line
    .replace(/\u00a0/g, " ")
    .replace(/([^\s])(RM(?=[\s\d,.]))/gi, "$1 $2")
    .replace(/(RM\s?[\d,.]+)(?=[A-Za-z(])/g, "$1 ");
  return collapse_spaces(spaced);
}

function collapsed_upper(text: string): string {
  return text.toUpperCase().replace(/\s+/g, " ");
}

function detect_score(text: string): number {
  const upper = text.toUpperCase();
  const flat = collapsed_upper(text);
  let score = 0;
  if (/TNG\s+WALLET\s+TRANSACTION\s+HISTORY/.test(upper) ||
    flat.includes("TNG WALLET TRANSACTION HISTORY")) {
    score += 0.38;
  }
  if (
    (/TNG\s+WALLET\s+TRANSACTION/.test(upper) &&
      /GO\+\s+TRANSACTION/.test(upper)) ||
    (flat.includes("TNG WALLET TRANSACTION") && flat.includes("GO+ TRANSACTION"))
  ) {
    score += 0.32;
  }
  if (/WALLET\s+ID/.test(upper) || flat.includes("WALLET ID")) score += 0.08;
  if (/TRANSACTION\s+PERIOD/.test(upper) || flat.includes("TRANSACTION PERIOD")) {
    score += 0.06;
  }
  if (/REGISTERED\s+NAME/.test(upper) || flat.includes("REGISTERED NAME")) {
    score += 0.04;
  }
  if (RECORD_START.test(text) || RECORD_START.test(flat)) score += 0.1;
  if (
    flat.includes("AMOUNT (RM)") &&
    flat.includes("WALLET BALANCE")
  ) {
    score += 0.06;
  }
  return Math.min(score, 0.99);
}

/** Weak keyword signal when layout is broken but content is still present. */
export function tng_wallet_has_keyword_hints(text: string): boolean {
  const flat = collapsed_upper(text);
  return (
    flat.includes("TNG WALLET") &&
    (flat.includes("TRANSACTION HISTORY") ||
      flat.includes("GO+ TRANSACTION") ||
      flat.includes("WALLET ID"))
  );
}

export function tng_wallet_layout_score(text: string): number {
  return detect_score(text);
}

export function tng_wallet_is_likely_statement(text: string): boolean {
  return detect_score(text) >= 0.48;
}

function is_disclaimer_line(line: string): boolean {
  const lower = line.toLowerCase();
  return DISCLAIMER.some((kw) => lower.includes(kw));
}

function preprocess_lines(raw: string): Array<{ line: string; section: TngAccount }> {
  const out: Array<{ line: string; section: TngAccount }> = [];
  let section: TngAccount = "wallet";
  for (const raw_line of raw.split("\n")) {
    const line = normalize_tng_wallet_pdf_line(raw_line);
    if (!line) continue;
    if (is_disclaimer_line(line)) continue;
    const upper = line.toUpperCase();
    if (/^TNG WALLET TRANSACTION$/i.test(line)) {
      section = "wallet";
      continue;
    }
    if (/^GO\+\s*TRANSACTION$/i.test(line)) {
      section = "go_plus";
      continue;
    }
    if (SKIP_LINE.test(line) || upper.includes("TRANSACTION HISTORY")) continue;
    out.push({ line, section });
  }
  return out;
}

function split_record_groups(
  tagged: Array<{ line: string; section: TngAccount }>,
): Array<{ section: TngAccount; chunk: string[] }> {
  const expanded: Array<{ line: string; section: TngAccount }> = [];
  for (let i = 0; i < tagged.length; i++) {
    const entry = tagged[i];
    if (
      /^\d{1,2}\/\d{1,2}\/\d{4}\s+(Success|Pending|Failed)\s+DUITNOW_\w+$/i.test(
        entry.line,
      ) &&
      i + 1 < tagged.length &&
      /^[A-Z0-9_]+$/i.test(tagged[i + 1].line)
    ) {
      expanded.push({
        line: `${entry.line} ${tagged[i + 1].line}`,
        section: entry.section,
      });
      i += 1;
      continue;
    }
    expanded.push(entry);
  }

  const groups: Array<{ section: TngAccount; chunk: string[] }> = [];
  let current: string[] = [];
  let current_section: TngAccount = "wallet";

  for (const { line, section } of expanded) {
    if (RECORD_START.test(line)) {
      if (current.length) {
        groups.push({ section: current_section, chunk: current });
      }
      current = [line];
      current_section = section;
      continue;
    }
    if (current.length) current.push(line);
  }
  if (current.length) groups.push({ section: current_section, chunk: current });
  return groups;
}

const KNOWN_TXN_TYPES = [
  "GO+ Daily Earnings",
  "GO+ Cash In",
  "eWallet Cash Out",
  "RFID Payment",
  "Transfer to Wallet",
  "Receive from Wallet",
  "DUITNOW_RECEIVEFROM",
  "DUITNOW_RECEI VEFROM",
  "Reload",
  "Payment",
  "Refund",
];

function parse_header_line(line: string): {
  date_dmy: string;
  status: string;
  raw_type: string;
  reference: string;
} {
  const prefix = line.match(
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(Success|Pending|Failed)\s+(.*)$/i,
  );
  if (prefix) {
    const rest = prefix[3].trim();
    for (const known of KNOWN_TXN_TYPES) {
      if (rest.toUpperCase().startsWith(known.toUpperCase())) {
        const tail = rest.slice(known.length).trim();
        const ref = tail.match(/^(\S+)/);
        return {
          date_dmy: prefix[1],
          status: prefix[2],
          raw_type: known.replace("DUITNOW_RECEI VEFROM", "DUITNOW_RECEIVEFROM"),
          reference: ref?.[1] ?? "",
        };
      }
    }
  }

  const go_plus_line = line.match(
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(Success|Pending|Failed)\s+(GO\+.*?)(?:\s+(\S+))?\s*$/i,
  );
  if (go_plus_line) {
    return {
      date_dmy: go_plus_line[1],
      status: go_plus_line[2],
      raw_type: go_plus_line[3].trim(),
      reference: (go_plus_line[4] ?? "").trim(),
    };
  }

  const strict = line.match(
    /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(Success|Pending|Failed)\s+(.*?)\s+(\S+)$/i,
  );
  if (strict) {
    return {
      date_dmy: strict[1],
      status: strict[2],
      raw_type: strict[3].trim(),
      reference: strict[4].trim(),
    };
  }
  const parts = line.split(/\s+/);
  if (parts.length < 3) throw new Error("Header line too short");
  return {
    date_dmy: parts[0],
    status: parts[1],
    raw_type: parts.slice(2, -1).join(" ") || "Unknown",
    reference: parts[parts.length - 1] ?? "",
  };
}

function find_amount_line(lines: string[]): string | null {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (RM_PAIR_END.test(lines[i])) return lines[i];
  }
  return null;
}

function build_description(inner_lines: string[]): string {
  const description_lines: string[] = [];
  for (const line of inner_lines) {
    if (RM_PAIR_END.test(line)) continue;
    const is_long_id = /\d{20,}/.test(line);
    const has_content = line.replace(/[^a-zA-Z]/g, "").length > 5;
    if (has_content && !is_long_id) {
      description_lines.push(line.replace(/\d{20,}/g, "").trim());
    }
  }
  return description_lines.join(" ").trim();
}

function parse_rm_pair(
  line: string,
  account: TngAccount,
): { amount_micro: MicroAmount; balance_micro: MicroAmount } {
  const match = line.match(RM_PAIR_END);
  if (!match) throw new Error("Amount line must contain two RM values");
  const max_dp = display_dp_for_account(account);
  const amount_micro = major_text_to_micro(match[1].replace(/,/g, ""), max_dp);
  const balance_micro = major_text_to_micro(match[2].replace(/,/g, ""), max_dp);
  return { amount_micro, balance_micro };
}

function type_direction_fallback(raw_type: string, description: string): "in" | "out" {
  const flow = classify_tng_direction(raw_type, description);
  if (flow === "in") return "in";
  return "out";
}

function direction_from_balance(
  prev_balance: MicroAmount | null,
  amount_micro: MicroAmount,
  balance_micro: MicroAmount,
  raw_type: string,
  description: string,
): "in" | "out" {
  const fallback = type_direction_fallback(raw_type, description);
  if (prev_balance === null) {
    const opening_in = balance_micro - amount_micro;
    const opening_out = balance_micro + amount_micro;
    if (opening_in >= 0 && fallback === "in") return "in";
    if (opening_out >= 0 && fallback === "out") return "out";
    return fallback;
  }
  if (prev_balance + amount_micro === balance_micro) return "in";
  if (prev_balance - amount_micro === balance_micro) return "out";
  return fallback;
}

function row_affects_totals(success: boolean, raw_type: string): boolean {
  if (!success) return false;
  const t = raw_type.toLowerCase();
  if (t.includes("ewallet cash out")) return false;
  return true;
}

function parse_rfid_txn_at(date_iso: string, inner: string[]): string | null {
  for (const line of inner) {
    const match = line.match(RFID_DETAIL_TIME);
    if (!match) continue;
    const [, dmy, hh, mm, ampm] = match;
    const iso_date = parse_tng_dump_date(dmy);
    let hour = Number.parseInt(hh, 10);
    const minute = mm.padStart(2, "0");
    if (ampm.toUpperCase() === "PM" && hour < 12) hour += 12;
    if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
    return `${iso_date}T${String(hour).padStart(2, "0")}:${minute}:00Z`;
  }
  return null;
}

function strip_rm_tail(line: string): { headline: string; amount_line: string | null } {
  const match = line.match(/^(.*)\s+(RM\s?[\d,.]+\s+RM\s?[\d,.]+)\s*$/i);
  if (!match) return { headline: line, amount_line: null };
  return { headline: match[1].trim(), amount_line: match[2].trim() };
}

function parse_record_group(
  group: { section: TngAccount; chunk: string[] },
  parse_index: number,
): LedgerDraft | null {
  if (group.chunk.length < 1) return null;
  const { headline, amount_line: inline_amount } = strip_rm_tail(group.chunk[0]);
  const header = parse_header_line(headline);
  const success = /^success$/i.test(header.status.trim());
  if (!success) return null;

  const amount_line = inline_amount ?? find_amount_line(group.chunk);
  if (!amount_line) return null;

  const amount_idx = inline_amount
    ? 0
    : group.chunk.indexOf(amount_line);
  const inner = inline_amount
    ? group.chunk.slice(1).filter((l) => !RM_PAIR_END.test(l))
    : group.chunk.slice(1, amount_idx);
  const headline_desc = headline
    .replace(
      new RegExp(
        `^\\d{1,2}/\\d{1,2}/\\d{4}\\s+${header.status}\\s+${header.raw_type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+${header.reference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`,
        "i",
      ),
      "",
    )
    .trim();
  const inner_desc = build_description(inner);
  const description =
    [headline_desc, inner_desc].filter(Boolean).join(" ").trim() ||
    normalize_tng_type(header.raw_type, "");
  const normalized_type = normalize_tng_type(header.raw_type, description);
  const { amount_micro, balance_micro } = parse_rm_pair(
    amount_line,
    group.section,
  );
  const date_iso = parse_tng_dump_date(header.date_dmy);
  const txn_at =
    parse_rfid_txn_at(date_iso, [headline_desc, ...inner]) ??
    `${date_iso}T00:00:00Z`;

  return {
    parse_index,
    section: group.section,
    date_iso,
    txn_at,
    status: header.status,
    raw_type: header.raw_type,
    normalized_type,
    reference: header.reference,
    description,
    direction: "in",
    amount_micro,
    balance_micro,
    affects_totals: row_affects_totals(success, header.raw_type),
    derived: false,
    review_reasons: [],
  };
}

function is_quick_reload_via_go_plus(row: LedgerDraft): boolean {
  const d = row.description.toLowerCase();
  return (
    row.section === "wallet" &&
    d.includes("quick reload payment") &&
    d.includes("go+")
  );
}

function inject_derived_go_plus_outflows(
  wallet_rows: LedgerDraft[],
  go_rows: LedgerDraft[],
): LedgerDraft[] {
  const derived: LedgerDraft[] = [];
  let derived_index = 0;
  for (const w of wallet_rows) {
    if (!w.affects_totals || !is_quick_reload_via_go_plus(w)) continue;
    derived.push({
      parse_index: w.parse_index + 0.001 + derived_index * 0.0001,
      section: "go_plus",
      date_iso: w.date_iso,
      txn_at: w.txn_at,
      status: "Success",
      raw_type: "GO+ Cash Out",
      normalized_type: "GO+ Cash Out",
      reference: w.reference,
      description: w.description,
      direction: "out",
      amount_micro: w.amount_micro,
      balance_micro: 0,
      affects_totals: true,
      derived: true,
      review_reasons: ["Derived from eWallet reload"],
    });
    derived_index += 1;
  }
  return [...go_rows, ...derived];
}

/** PDF lists newest-first within a day; ascending parse_index is reversed chronology. */
function sort_ledger(rows: LedgerDraft[]): LedgerDraft[] {
  return [...rows].sort(
    (a, b) =>
      a.date_iso.localeCompare(b.date_iso) ||
      b.parse_index - a.parse_index,
  );
}

/** Distinct txn_at per same calendar day so balance validation can order ties. */
function stamp_same_day_txn_at(rows: LedgerDraft[]): void {
  const seq = new Map<string, number>();
  for (const row of rows) {
    const midnight = `${row.date_iso}T00:00:00Z`;
    if (row.txn_at !== midnight) continue;
    const key = `${row.section}|${row.date_iso}`;
    const n = seq.get(key) ?? 0;
    seq.set(key, n + 1);
    row.txn_at = `${row.date_iso}T00:00:${String(n + 1).padStart(2, "0")}Z`;
  }
}

function assign_directions(rows: LedgerDraft[]): void {
  const wallet_sorted = sort_ledger(rows.filter((r) => r.section === "wallet"));
  const go_sorted = sort_ledger(rows.filter((r) => r.section === "go_plus"));

  let wallet_prev: MicroAmount | null = null;
  for (const row of wallet_sorted) {
    if (!row.affects_totals) continue;
    row.direction = direction_from_balance(
      wallet_prev,
      row.amount_micro,
      row.balance_micro,
      row.raw_type,
      row.description,
    );
    wallet_prev = row.balance_micro;
  }

  let go_prev: MicroAmount | null = null;
  for (const row of go_sorted) {
    if (!row.affects_totals) continue;
    if (row.derived && go_prev !== null) {
      row.balance_micro = go_prev - row.amount_micro;
    }
    row.direction = direction_from_balance(
      go_prev,
      row.amount_micro,
      row.balance_micro,
      row.raw_type,
      row.description,
    );
    go_prev = row.balance_micro;
  }
}

function reconcile_go_plus(rows: LedgerDraft[]): void {
  const go_sorted = sort_ledger(
    rows.filter((r) => r.section === "go_plus" && r.affects_totals),
  );
  let running: MicroAmount | null = null;
  for (const row of go_sorted) {
    if (running !== null && !row.derived) {
      const expected =
        row.direction === "in"
          ? running + row.amount_micro
          : running - row.amount_micro;
      const delta = row.balance_micro - expected;
      if (Math.abs(delta) >= 100) {
        const explained =
          row.review_reasons.length > 0 ||
          go_sorted.some(
            (other) =>
              other.derived &&
              other.date_iso === row.date_iso &&
              other.amount_micro === Math.abs(delta),
          );
        if (!explained) {
          row.review_reasons.push(
            "GO+ balance gap (may be unreconciled GO+ outflow)",
          );
        }
      }
    }
    running = row.balance_micro;
  }
}

function to_import_row(
  row: LedgerDraft,
  temp_index: number,
): NormalizedImportRow {
  const account =
    row.section === "go_plus" ? GO_CFG : WALLET_CFG;
  const max_dp = display_dp_for_account(row.section);
  const amount_major = format_micro_major_precise(row.amount_micro, max_dp);
  const balance_major = format_micro_major_precise(row.balance_micro, max_dp);
  const money = row_money_from_direction(
    row.direction,
    amount_major,
    balance_major,
  );
  const status: NormalizedImportRow["status"] =
    row.review_reasons.length > 0 ? "needs_review" : "new";

  return {
    temp_id: `tng-pdf-${temp_index}`,
    txn_at: row.txn_at,
    description: row.description,
    detail: row.reference,
    txn_type: row.normalized_type,
    direction: row.direction,
    amount_major,
    balance_after_major: balance_major,
    ...money,
    status,
    review_reasons: row.review_reasons,
    account_id: account.account_id,
    account_ref: account.account_ref,
  };
}

export function parse_tng_wallet_statement(text: string): {
  rows: NormalizedImportRow[];
  accounts: ImportParsedAccount[];
  parse_warning: string | null;
} {
  const tagged = preprocess_lines(text);
  const groups = split_record_groups(tagged);
  const drafts: LedgerDraft[] = [];
  groups.forEach((group, index) => {
    try {
      const row = parse_record_group(group, index);
      if (row) drafts.push(row);
    } catch {
      /* skip malformed record */
    }
  });

  const wallet = drafts.filter((r) => r.section === "wallet");
  const go = drafts.filter((r) => r.section === "go_plus");
  const go_with_derived = inject_derived_go_plus_outflows(wallet, go);
  const merged = [...wallet, ...go_with_derived];
  assign_directions(merged);
  reconcile_go_plus(merged);

  const sorted = sort_ledger(merged).filter((r) => r.affects_totals);
  stamp_same_day_txn_at(sorted);
  const rows = sorted.map((r, i) => to_import_row(r, i));

  const accounts: ImportParsedAccount[] = [];
  if (rows.some((r) => r.account_ref === WALLET_CFG.account_ref)) {
    accounts.push({
      account_id: WALLET_CFG.account_id!,
      account_ref: WALLET_CFG.account_ref,
      account_label: WALLET_CFG.account_label,
    });
  }
  if (rows.some((r) => r.account_ref === GO_CFG.account_ref)) {
    accounts.push({
      account_id: GO_CFG.account_id!,
      account_ref: GO_CFG.account_ref,
      account_label: GO_CFG.account_label,
    });
  }

  return {
    rows,
    accounts,
    parse_warning: rows.length === 0 ? null : null,
  };
}

export const tng_wallet_parser: StatementParser = {
  id: "tng_wallet",
  detect(text: string) {
    const score = detect_score(text);
    const is_history =
      /TNG\s+WALLET\s+TRANSACTION\s+HISTORY/i.test(text) ||
      collapsed_upper(text).includes("TNG WALLET TRANSACTION HISTORY");
    if (is_history && score < 0.48) {
      return { id: "tng_wallet", score: 0.55 };
    }
    if (tng_wallet_has_keyword_hints(text) && score < 0.48) {
      return { id: "tng_wallet", score: 0.52 };
    }
    return { id: "tng_wallet", score };
  },
  parse(text: string): NormalizedImportRow[] {
    return parse_tng_wallet_statement(text).rows;
  },
};