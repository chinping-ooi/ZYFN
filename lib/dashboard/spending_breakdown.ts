import { is_cash_flow_excluded } from "@/lib/dashboard/cash_flow_exclusion";
import type { MonthKey } from "@/lib/dashboard/metrics";
import type { AccountStatementFromDb } from "@/lib/supabase/types";
import type { TransactionDbRow } from "@/lib/supabase/transaction_rows";
import { micro_to_sen_display } from "@/lib/tng/money_micro";
import type { MinorAmount } from "@/lib/money";
import { spending_breakdown_account_bucket } from "@/lib/transactions/account_config";

const KL = "Asia/Kuala_Lumpur";

export type SpendingTransactionRow = {
  id: string;
  sort_at: string;
  sort_id: number;
  date_label: string;
  label: string;
  account: string;
  amount_sen: MinorAmount;
};

function month_key(iso_date: string): MonthKey {
  return iso_date.slice(0, 7);
}

function outflow_sen(row: TransactionDbRow, use_micro: boolean): number {
  if (use_micro) {
    return row.out_micro > 0 ? micro_to_sen_display(row.out_micro) : 0;
  }
  return row.out_sen;
}

function row_label(row: TransactionDbRow): string {
  const desc = row.description.trim();
  const detail = row.detail.trim();
  if (desc && detail && detail !== desc) {
    return `${desc} · ${detail}`;
  }
  return desc || detail || "—";
}

function format_txn_date(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: KL,
  }).format(new Date(iso));
}

export function spending_transactions_for_month(
  statements: AccountStatementFromDb[],
  month: MonthKey,
): SpendingTransactionRow[] {
  const items: SpendingTransactionRow[] = [];

  for (const statement of statements) {
    const { label: account } = spending_breakdown_account_bucket(statement);
    const use_micro = statement.amount_scale === "micro";
    for (const row of statement.rows) {
      if (month_key(row.date) !== month) continue;
      if (is_cash_flow_excluded(row)) continue;
      const spent = outflow_sen(row, use_micro);
      if (spent <= 0) continue;
      items.push({
        id: `${statement.account_ref}-${row.sort_id}`,
        sort_at: row.date,
        sort_id: row.sort_id,
        date_label: format_txn_date(row.date),
        label: row_label(row),
        account,
        amount_sen: spent,
      });
    }
  }

  items.sort((a, b) => {
    const at = b.sort_at.localeCompare(a.sort_at);
    if (at !== 0) return at;
    return b.sort_id - a.sort_id;
  });

  return items;
}

export function spending_total_sen(rows: SpendingTransactionRow[]): number {
  return rows.reduce((sum, row) => sum + row.amount_sen, 0);
}