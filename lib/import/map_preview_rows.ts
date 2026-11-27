import type { TransactionTableRow } from "@/components/data_table/transaction_columns";
import { account_config_by_ref } from "@/lib/accounts/registry";
import { import_row_status_label } from "@/lib/import/import_labels";
import type { NormalizedImportRow } from "@/lib/import/types";
import { decimal_myr_to_micro } from "@/lib/supabase/decimal_to_micro";

const TNG_PREVIEW_REFS = new Set(["TNG_EWALLET", "TNG_GO_PLUS"]);

/** Map parsed import lines to the same row shape used on statement pages. */
export function map_import_rows_to_statement_rows(
  rows: NormalizedImportRow[],
): TransactionTableRow[] {
  return rows.map((row, index) => {
    const base = {
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
      import_status: import_row_status_label(row.status),
      status_hint: row.review_reasons.join("; "),
      account_label: row.account_ref
        ? (account_config_by_ref(row.account_ref)?.account_label ??
          row.account_ref)
        : "",
      tng_sub_account:
        row.account_ref === "TNG_GO_PLUS"
          ? ("go_plus" as const)
          : row.account_ref === "TNG_EWALLET"
            ? ("wallet" as const)
            : undefined,
    };

    if (row.account_ref && TNG_PREVIEW_REFS.has(row.account_ref)) {
      const amount_micro = decimal_myr_to_micro(row.amount_major);
      const balance_micro = decimal_myr_to_micro(row.balance_after_major);
      return {
        ...base,
        in_micro: row.direction === "in" ? amount_micro : 0,
        out_micro: row.direction === "out" ? amount_micro : 0,
        balance_micro,
      };
    }

    return base;
  });
}