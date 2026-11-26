import type { ImportParsedAccount, NormalizedImportRow } from "@/lib/import/types";

export function group_import_rows_by_account(
  rows: NormalizedImportRow[],
): Map<number, NormalizedImportRow[]> {
  const map = new Map<number, NormalizedImportRow[]>();
  for (const row of rows) {
    const id = row.account_id;
    if (id == null) continue;
    const list = map.get(id) ?? [];
    list.push(row);
    map.set(id, list);
  }
  return map;
}

export function import_account_summaries(
  rows: NormalizedImportRow[],
  accounts: ImportParsedAccount[],
): Array<
  ImportParsedAccount & {
    new_count: number;
    duplicate_count: number;
    review_count: number;
  }
> {
  return accounts.map((account) => {
    const subset = rows.filter((r) => r.account_id === account.account_id);
    return {
      ...account,
      new_count: subset.filter((r) => r.status === "new").length,
      duplicate_count: subset.filter((r) => r.status === "duplicate").length,
      review_count: subset.filter((r) => r.status === "needs_review").length,
    };
  });
}