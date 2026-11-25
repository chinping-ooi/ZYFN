import { dedupe_key_parts, normalize_description_for_key } from "@/lib/import/normalize";
import type { NormalizedImportRow } from "@/lib/import/types";

export type ExistingTxnForDedupe = {
  txn_at: string;
  amount: string | number;
  description: string | null;
  balance_after: string | number;
};

export function existing_dedupe_keys(
  account_id: number,
  rows: ExistingTxnForDedupe[],
): Set<string> {
  const keys = new Set<string>();
  for (const row of rows) {
    keys.add(
      dedupe_key_parts({
        account_id,
        txn_at: row.txn_at,
        amount_major: String(row.amount).trim(),
        description: normalize_description_for_key(row.description ?? ""),
        balance_after_major: String(row.balance_after).trim(),
      }),
    );
  }
  return keys;
}

export function mark_duplicates(
  account_id: number,
  import_rows: NormalizedImportRow[],
  existing_keys: Set<string>,
): void {
  const seen_import = new Set<string>();
  for (const row of import_rows) {
    const key = dedupe_key_parts({
      account_id,
      txn_at: row.txn_at,
      amount_major: row.amount_major,
      description: row.description,
      balance_after_major: row.balance_after_major,
    });
    if (existing_keys.has(key) || seen_import.has(key)) {
      row.status = "duplicate";
      if (!row.review_reasons.includes("Duplicate")) {
        row.review_reasons.push("Duplicate");
      }
    } else if (row.status === "new") {
      seen_import.add(key);
    }
  }
}