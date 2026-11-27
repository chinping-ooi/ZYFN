import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { build_transaction_statement } from "@/lib/supabase/transaction_statement";
import type { MinorAmount } from "@/lib/money";
import {
  mbb_2_gold_card_href,
  type Mbb2GoldCardSegment,
} from "@/lib/credit_cards/mbb_2_gold_routes";

export type Mbb2GoldBreakdownRowKey = Mbb2GoldCardSegment | "combined";

export type Mbb2GoldCardBreakdownRow = {
  key: Mbb2GoldBreakdownRowKey;
  label: string;
  href: string | null;
  spending_sen: MinorAmount;
  payments_sen: MinorAmount;
  outstanding_sen: MinorAmount | null;
  outstanding_hint: string | null;
};

function month_slice(
  rows: TransactionDbRow[],
  month: string,
  closing_sen_full: MinorAmount,
) {
  return build_transaction_statement(rows, month, closing_sen_full, 0);
}

function card_row_metrics(
  rows: TransactionDbRow[],
  month: string,
  closing_sen_full: MinorAmount,
  key: Mbb2GoldBreakdownRowKey,
  label: string,
  href: string | null,
): Mbb2GoldCardBreakdownRow {
  if (rows.length === 0) {
    return {
      key,
      label,
      href,
      spending_sen: 0,
      payments_sen: 0,
      outstanding_sen: null,
      outstanding_hint: "No transaction data loaded",
    };
  }

  const slice = month_slice(rows, month, closing_sen_full);
  const had_month_activity = slice.rows.length > 0;

  return {
    key,
    label,
    href,
    spending_sen: slice.total_out_sen,
    payments_sen: slice.total_in_sen,
    outstanding_sen: had_month_activity
      ? slice.closing_sen
      : closing_sen_full,
    outstanding_hint: had_month_activity
      ? null
      : "No activity this month · balance is latest on file",
  };
}

/** Month-level spending, payments, and closing balance per card and combined. */
export function mbb_2_gold_card_breakdown(
  month: string,
  visa_rows: TransactionDbRow[],
  amex_rows: TransactionDbRow[],
  combined_rows: TransactionDbRow[],
  visa_closing_sen: MinorAmount,
  amex_closing_sen: MinorAmount,
): Mbb2GoldCardBreakdownRow[] {
  const visa = card_row_metrics(
    visa_rows,
    month,
    visa_closing_sen,
    "1697",
    "Visa 1697",
    mbb_2_gold_card_href("1697"),
  );
  const amex = card_row_metrics(
    amex_rows,
    month,
    amex_closing_sen,
    "8060",
    "Amex 8060",
    mbb_2_gold_card_href("8060"),
  );

  const combined_outstanding =
    (visa.outstanding_sen ?? 0) + (amex.outstanding_sen ?? 0);

  const combined_slice = month_slice(combined_rows, month, combined_outstanding);

  const combined: Mbb2GoldCardBreakdownRow = {
    key: "combined",
    label: "Combined",
    href: null,
    spending_sen: combined_slice.total_out_sen,
    payments_sen: combined_slice.total_in_sen,
    outstanding_sen: combined_outstanding,
    outstanding_hint:
      visa.outstanding_sen === null && amex.outstanding_sen === null
        ? "No transaction data loaded"
        : null,
  };

  return [visa, amex, combined];
}

export function mbb_2_gold_used_limit_sen(
  breakdown: Mbb2GoldCardBreakdownRow[],
): MinorAmount {
  const combined = breakdown.find((r) => r.key === "combined");
  return combined?.outstanding_sen ?? 0;
}

export function mbb_2_gold_limit_segment_sen(
  breakdown: Mbb2GoldCardBreakdownRow[],
): { visa_sen: MinorAmount; amex_sen: MinorAmount } {
  const visa = breakdown.find((r) => r.key === "1697");
  const amex = breakdown.find((r) => r.key === "8060");
  return {
    visa_sen: visa?.outstanding_sen ?? 0,
    amex_sen: amex?.outstanding_sen ?? 0,
  };
}