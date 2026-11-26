import { describe, expect, it } from "vitest";
import { resolve_table_export_rows } from "@/lib/data_table/export_source_rows";

type Row = { id: number; date: string };

function fixture_rows(count: number): Row[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    date: `2025-01-${String((index % 28) + 1).padStart(2, "0")}`,
  }));
}

describe("resolve_table_export_rows", () => {
  it("exports all loaded rows when export_all_rows is set", () => {
    const safe_rows = fixture_rows(30);
    const filtered = safe_rows.filter((row) => row.id < 3);
    const export_rows = resolve_table_export_rows({
      export_all_rows: true,
      safe_rows,
      filtered,
    });
    expect(export_rows).toHaveLength(30);
    expect(export_rows.some((row) => row.id >= 25)).toBe(true);
  });

  it("keeps statement export limited to search-filtered rows", () => {
    const safe_rows = fixture_rows(30);
    const filtered = safe_rows.filter((row) => row.id < 5);
    const export_rows = resolve_table_export_rows({
      export_all_rows: false,
      safe_rows,
      filtered,
    });
    expect(export_rows).toHaveLength(5);
  });

  it("honours export_rows override for import preview", () => {
    const safe_rows = fixture_rows(10);
    const override = fixture_rows(40);
    const export_rows = resolve_table_export_rows({
      export_all_rows: true,
      export_rows: override,
      safe_rows,
      filtered: safe_rows.slice(0, 2),
    });
    expect(export_rows).toHaveLength(40);
  });
});