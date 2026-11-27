import { describe, expect, it } from "vitest";
import {
  is_visible_table_column,
  visible_table_columns,
} from "@/components/data_table/visible_columns";
import type { DataTableColumn } from "@/components/data_table/types";

type Row = { a: string; b: string; c: string };

describe("visible_table_columns", () => {
  it("drops blank labels unless allow_blank_header is set", () => {
    const columns: DataTableColumn<Row>[] = [
      { key: "a", label: "Name" },
      { key: "b", label: " " },
      { key: "c", label: "", allow_blank_header: true },
    ];
    expect(visible_table_columns(columns).map((c) => c.key)).toEqual(["a", "c"]);
    expect(is_visible_table_column(columns[1] as never)).toBe(false);
    expect(is_visible_table_column(columns[2] as never)).toBe(true);
  });
});