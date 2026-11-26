import { describe, expect, it } from "vitest";
import { transaction_columns } from "@/components/data_table/transaction_columns";
import { column_header_label } from "@/components/data_table/visible_columns";

describe("import preview ledger columns", () => {
  it("reuses transaction columns plus Status for bank accounts", () => {
    const base = transaction_columns("bank").map((c) => c.key);
    const with_status = transaction_columns("bank", { import_status: true }).map(
      (c) => c.key,
    );
    expect(with_status).toEqual([...base, "import_status", "status_hint"]);
    expect(with_status).toHaveLength(9);
  });

  it("uses credit-card money labels with Status", () => {
    const cols = transaction_columns("credit_card", { import_status: true });
    expect(cols.map((c) => c.label)).toEqual([
      "Date",
      "Type",
      "Detail",
      "Description",
      "Credit",
      "Debit",
      "Owed",
      "Status",
      "Status reason",
    ]);
  });

  it("has no blank headers", () => {
    const cols = transaction_columns("bank", { import_status: true });
    expect(new Set(cols.map((c) => c.key)).size).toBe(cols.length);
    for (const column of cols) {
      expect(column_header_label(column as never).trim().length).toBeGreaterThan(
        0,
      );
    }
  });
});