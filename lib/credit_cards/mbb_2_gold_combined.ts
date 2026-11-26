import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";

/** Maybank 2 Gold Visa (1697) + Amex (8060) — shared combined credit limit. */
export const MBB_2_GOLD_SLUG = "mbb-2-gold";
export const MBB_2_GOLD_ACCOUNT_REF = "MBB_2_GOLD";
export const MBB_2_GOLD_LABEL = "MBB 2 Gold";

export const MBB_2_GOLD_MEMBER_REFS = [
  "MBB_VISA_1697",
  "MBB_AMEX_8060",
] as const;

export type Mbb2GoldMemberRef = (typeof MBB_2_GOLD_MEMBER_REFS)[number];

type TaggedRow = TransactionDbRow & {
  _source_account_ref: Mbb2GoldMemberRef;
};

function tag_rows(
  rows: TransactionDbRow[],
  account_ref: Mbb2GoldMemberRef,
): TaggedRow[] {
  return rows.map((row) => ({ ...row, _source_account_ref: account_ref }));
}

/** Newest-first, same ordering as single-account statements. */
export function merge_mbb_2_gold_rows(
  visa_rows: TransactionDbRow[],
  amex_rows: TransactionDbRow[],
): TaggedRow[] {
  return [
    ...tag_rows(visa_rows, "MBB_VISA_1697"),
    ...tag_rows(amex_rows, "MBB_AMEX_8060"),
  ].sort((a, b) => {
    const by_date = b.date.localeCompare(a.date);
    if (by_date !== 0) return by_date;
    return b.sort_id - a.sort_id;
  });
}

const INTER_PAYMENT_RE = {
  MBB_VISA_1697: /\b(AMEX|8060)\b|MAYBANK\s+2\s+GOLD\s+AMEX/i,
  MBB_AMEX_8060: /\b(VISA|1697)\b|MAYBANK\s+2\s+GOLD\s+VISA/i,
} as const;

function row_text(row: TaggedRow): string {
  return `${row.description} ${row.detail} ${row.txn_type} ${row.pair_ref ?? ""}`;
}

/** Drop cross-card payments between the two gold cards (combined limit). */
export function is_inter_mbb_2_gold_payment(row: TaggedRow): boolean {
  const text = row_text(row).toUpperCase();
  const sibling_hint =
    row._source_account_ref === "MBB_VISA_1697"
      ? INTER_PAYMENT_RE.MBB_VISA_1697.test(text)
      : INTER_PAYMENT_RE.MBB_AMEX_8060.test(text);

  if (
    sibling_hint &&
    (row.txn_type === "cc_payment" || /\bPAYMENT\b/i.test(row.txn_type))
  ) {
    return true;
  }

  if (row.pair_ref) {
    const pr = row.pair_ref.toUpperCase();
    if (
      row._source_account_ref === "MBB_VISA_1697" &&
      /\b(AMEX|8060)\b/.test(pr)
    ) {
      return true;
    }
    if (
      row._source_account_ref === "MBB_AMEX_8060" &&
      /\b(VISA|1697)\b/.test(pr)
    ) {
      return true;
    }
  }

  return false;
}

export function filter_inter_mbb_2_gold_payments(
  rows: TaggedRow[],
): TransactionDbRow[] {
  return rows.filter((row) => !is_inter_mbb_2_gold_payment(row)).map(strip_source_tag);
}

function strip_source_tag(row: TaggedRow): TransactionDbRow {
  const { _source_account_ref, ...rest } = row;
  void _source_account_ref;
  return rest;
}

export function prepare_mbb_2_gold_combined_rows(
  visa_rows: TransactionDbRow[],
  amex_rows: TransactionDbRow[],
): TransactionDbRow[] {
  const merged = merge_mbb_2_gold_rows(visa_rows, amex_rows);
  return filter_inter_mbb_2_gold_payments(merged);
}

export function combined_mbb_2_gold_closing_sen(
  visa_rows: TransactionDbRow[],
  amex_rows: TransactionDbRow[],
): number {
  const visa = visa_rows[0]?.balance_sen ?? 0;
  const amex = amex_rows[0]?.balance_sen ?? 0;
  return visa + amex;
}