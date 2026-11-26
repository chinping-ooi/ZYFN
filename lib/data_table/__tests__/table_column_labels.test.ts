import { describe, expect, it } from "vitest";
import { column_header_label } from "@/components/data_table/visible_columns";
import { fixed_deposit_columns } from "@/components/data_table/fixed_deposit_columns";
import { transaction_columns } from "@/components/data_table/transaction_columns";
import type { DataTableColumn } from "@/components/data_table/types";

const ACCOUNT_KINDS = [
  "bank",
  "credit_card",
  "tng_wallet",
  "tng_go_plus",
] as const;

function assert_labeled_columns<T>(
  name: string,
  columns: DataTableColumn<T>[],
) {
  const keys = columns.map((c) => c.key);
  expect(new Set(keys).size, `${name}: duplicate column keys`).toBe(keys.length);
  for (const column of columns) {
    if (column.allow_blank_header) continue;
    expect(
      column_header_label(column as never).trim().length,
      `${name}: column ${column.key} has empty header`,
    ).toBeGreaterThan(0);
  }
}

describe("DataTable column definitions", () => {
  it("labels every transaction and FD column", () => {
    for (const kind of ACCOUNT_KINDS) {
      assert_labeled_columns(`transaction:${kind}`, transaction_columns(kind));
    }
    assert_labeled_columns(
      "fixed_deposit:bank",
      fixed_deposit_columns(true),
    );
    assert_labeled_columns(
      "fixed_deposit:no_bank",
      fixed_deposit_columns(false),
    );
  });
});