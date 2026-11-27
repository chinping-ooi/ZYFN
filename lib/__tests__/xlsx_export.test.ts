import { describe, expect, it } from "vitest";
import { transaction_columns } from "@/components/data_table/transaction_columns";
import { format_calendar_date } from "@/lib/format/date";
import {
  compute_export_column_widths,
  parse_calendar_date_for_xlsx,
} from "@/lib/xlsx_export";

describe("parse_calendar_date_for_xlsx", () => {
  it("keeps YYYY-MM-DD aligned with UI calendar day (MYT statements)", () => {
  const iso = "2025-11-01";
  const parsed = parse_calendar_date_for_xlsx(iso, "Asia/Kuala_Lumpur");
  expect(parsed).not.toBeNull();
  expect(parsed!.getFullYear()).toBe(2025);
  expect(parsed!.getMonth()).toBe(10);
  expect(parsed!.getDate()).toBe(1);

  const ui = format_calendar_date(iso, "Asia/Kuala_Lumpur");
  expect(ui).toContain("Nov");
  expect(ui).toContain("2025");
  expect(ui).toMatch(/1\b/);
  });

  it("does not shift 25 Oct import preview dates one day earlier", () => {
    const parsed = parse_calendar_date_for_xlsx("2025-10-25", "Asia/Kuala_Lumpur");
    expect(parsed!.getDate()).toBe(25);
    expect(parsed!.getMonth()).toBe(9);
  });
});

describe("compute_export_column_widths", () => {
  it("autosizes Status and Status reason within the column cap", () => {
    const columns = transaction_columns("credit_card", { import_status: true });
    const reason =
      "Matches saved record on 25 Oct 2026 (RM 16.90)";
    const rows = [
      {
        date: "2025-10-25",
        txn_type: "Retail",
        detail: "QRR",
        description: "Sample",
        in_sen: 0,
        out_sen: 1690,
        balance_sen: 10000,
        import_status: "Existing record",
        status_hint: reason,
      },
    ] as never[];

    const widths = compute_export_column_widths(columns, rows);
    const status_idx = columns.findIndex((c) => c.key === "import_status");
    const reason_idx = columns.findIndex((c) => c.key === "status_hint");
    expect(widths[status_idx]).toBeGreaterThanOrEqual("Existing record".length);
    expect(widths[reason_idx]).toBeGreaterThanOrEqual(reason.length);
    expect(widths[reason_idx]).toBeLessThanOrEqual(60);
    expect(widths.every((w) => w <= 60)).toBe(true);
  });
});