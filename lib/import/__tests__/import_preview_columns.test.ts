import { describe, expect, it } from "vitest";
import {
  IMPORT_PREVIEW_COLUMN_KEYS,
  IMPORT_PREVIEW_COLUMNS,
} from "@/components/import/import_preview_columns";
import { column_header_label } from "@/components/data_table/visible_columns";

describe("IMPORT_PREVIEW_COLUMNS", () => {
  it("uses the canonical eight column keys in order", () => {
    expect(IMPORT_PREVIEW_COLUMNS.map((c) => c.key)).toEqual([
      ...IMPORT_PREVIEW_COLUMN_KEYS,
    ]);
  });

  it("has no duplicate keys, blank headers, or removed phantom fields", () => {
    const keys = IMPORT_PREVIEW_COLUMNS.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain("merchant");
    expect(keys).not.toContain("status_hint");
    expect(keys).not.toContain("posting_date");
    expect(keys).not.toContain("needs_review");

    for (const column of IMPORT_PREVIEW_COLUMNS) {
      expect(column_header_label(column as never).trim().length).toBeGreaterThan(
        0,
      );
    }
  });
});