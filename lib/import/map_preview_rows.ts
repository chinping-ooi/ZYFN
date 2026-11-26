import type { TransactionTableRow } from "@/components/data_table/transaction_columns";
import type { NormalizedImportRow } from "@/lib/import/types";

function status_label(status: NormalizedImportRow["status"]): string {
  if (status === "duplicate") return "Duplicate";
  if (status === "needs_review") return "Needs review";
  return "New";
}

/** Map parsed import lines to the same row shape used on statement pages. */
export function map_import_rows_to_statement_rows(
  rows: NormalizedImportRow[],
): TransactionTableRow[] {
  return rows.map((row, index) => ({
    date: row.txn_at.slice(0, 10),
    txn_type: row.txn_type,
    detail: row.detail,
    description: row.description,
    in_sen: row.in_sen,
    out_sen: row.out_sen,
    balance_sen: row.balance_sen,
    in_micro: 0,
    out_micro: 0,
    balance_micro: 0,
    sort_id: index,
    import_status: status_label(row.status),
    status_hint: row.review_reasons.join("; "),
  }));
}