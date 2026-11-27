import { parse_amount_cell } from "@/lib/import/institutions/hlb_savings/amount";
import { descriptions_fuzzy_match } from "@/lib/import/normalize";
import type { NormalizedImportRow } from "@/lib/import/types";
import { format_calendar_date } from "@/lib/format/date";

const MYT = "Asia/Kuala_Lumpur";
const DATE_SLACK_DAYS = 3;

const MONTH_NUM: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export type ExistingTxnForDedupe = {
  id: number;
  txn_at: string;
  direction: "in" | "out";
  amount: string | number;
  description: string | null;
  detail: string | null;
};

export const TXN_SELECT_FOR_DEDUPE =
  "id, txn_at, direction, amount, description, detail";

export function calendar_date_myt(iso: string): string {
  const instant = iso.includes("T")
    ? new Date(iso)
    : new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MYT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function normalize_amount_major(raw: string | number): string {
  const major = parse_amount_cell(raw);
  return Math.abs(Number.parseFloat(major)).toFixed(2);
}

export function amount_fingerprint(
  direction: "in" | "out",
  amount: string | number,
): string {
  return `${direction}|${normalize_amount_major(amount)}`;
}

export function posted_date_from_detail(
  detail: string,
  reference_txn_at: string,
): string | null {
  const match = detail.match(/Posted\s+(\d{1,2})\s+([A-Za-z]{3})/i);
  if (!match) return null;
  const month = MONTH_NUM[match[2].toLowerCase()];
  if (!month) return null;
  const ref_month = Number.parseInt(reference_txn_at.slice(5, 7), 10);
  const ref_year = Number.parseInt(reference_txn_at.slice(0, 4), 10);
  const year = month > ref_month ? ref_year - 1 : ref_year;
  const day = match[1].padStart(2, "0");
  const month_part = String(month).padStart(2, "0");
  return `${year}-${month_part}-${day}`;
}

export function candidate_dates_for_import_row(row: NormalizedImportRow): string[] {
  const dates = new Set<string>();
  dates.add(calendar_date_myt(row.txn_at));
  const posted = posted_date_from_detail(row.detail, row.txn_at);
  if (posted) dates.add(posted);
  return [...dates];
}

export function candidate_dates_for_existing(row: ExistingTxnForDedupe): string[] {
  const dates = new Set<string>();
  dates.add(calendar_date_myt(row.txn_at));
  const posted = posted_date_from_detail(row.detail ?? "", row.txn_at);
  if (posted) dates.add(posted);
  return [...dates];
}

export function add_calendar_days(iso_date: string, delta: number): string {
  const d = new Date(`${iso_date.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function min_date_delta(left: string[], right: string[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const a of left) {
    for (const b of right) {
      const diff = Math.abs(day_diff(a, b));
      if (diff < min) min = diff;
    }
  }
  return min;
}

function day_diff(a: string, b: string): number {
  const ms =
    Date.parse(`${b.slice(0, 10)}T00:00:00Z`) -
    Date.parse(`${a.slice(0, 10)}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function dedupe_query_bounds(rows: NormalizedImportRow[]): {
  min: string;
  max: string;
} | null {
  const all: string[] = [];
  for (const row of rows) {
    all.push(...candidate_dates_for_import_row(row));
  }
  if (all.length === 0) return null;
  all.sort();
  return {
    min: add_calendar_days(all[0]!, -DATE_SLACK_DAYS),
    max: add_calendar_days(all.at(-1)!, DATE_SLACK_DAYS),
  };
}

function format_rm_major(amount: string | number): string {
  const major = normalize_amount_major(amount);
  return `RM ${major}`;
}

export function duplicate_match_reason(
  existing: ExistingTxnForDedupe,
  date_delta: number,
): string {
  const date_label = format_calendar_date(existing.txn_at, MYT);
  const amt = format_rm_major(existing.amount);
  const base = `Matches saved record on ${date_label} (${amt})`;
  if (date_delta > 0) {
    return `${base}; ${date_delta}-day date difference`;
  }
  return base;
}

export function similar_saved_record_reason(
  existing: ExistingTxnForDedupe,
): string {
  const date_label = format_calendar_date(existing.txn_at, MYT);
  const desc = (existing.description ?? "").trim() || "—";
  const amt = format_rm_major(existing.amount);
  return `Similar saved record: ${date_label} ${desc} ${amt}`;
}

type MatchPick = {
  index: number;
  existing: ExistingTxnForDedupe;
  date_delta: number;
  desc_match: boolean;
};

function pick_score(pick: MatchPick): number {
  return pick.date_delta * 10 + (pick.desc_match ? 0 : 5);
}

export function mark_duplicate_matches(
  import_rows: NormalizedImportRow[],
  existing: ExistingTxnForDedupe[],
  _account_id?: number,
): void {
  void _account_id;
  const used = new Set<number>();

  for (const row of import_rows) {
    if (row.status !== "new") continue;

    const fp = amount_fingerprint(row.direction, row.amount_major);
    const import_dates = candidate_dates_for_import_row(row);

    let pick: MatchPick | null = null;
    for (let i = 0; i < existing.length; i++) {
      if (used.has(i)) continue;
      const ex = existing[i]!;
      if (amount_fingerprint(ex.direction, ex.amount) !== fp) continue;
      const date_delta = min_date_delta(
        import_dates,
        candidate_dates_for_existing(ex),
      );
      if (date_delta > DATE_SLACK_DAYS) continue;
      const desc_match = descriptions_fuzzy_match(
        row.description,
        ex.description ?? "",
      );
      const candidate: MatchPick = {
        index: i,
        existing: ex,
        date_delta,
        desc_match,
      };
      if (!pick || pick_score(candidate) < pick_score(pick)) {
        pick = candidate;
      }
    }

    if (!pick) continue;

    used.add(pick.index);
    if (pick.desc_match) {
      row.status = "duplicate";
      const reason = duplicate_match_reason(pick.existing, pick.date_delta);
      if (!row.review_reasons.includes(reason)) {
        row.review_reasons.push(reason);
      }
    } else {
      row.status = "needs_review";
      const reason = similar_saved_record_reason(pick.existing);
      if (!row.review_reasons.includes(reason)) {
        row.review_reasons.push(reason);
      }
    }
  }
}