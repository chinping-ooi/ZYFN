import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DataTable } from "@/components/data_table/data_table";
import { transaction_columns } from "@/components/data_table/transaction_columns";
import type { TransactionTableRow } from "@/components/data_table/transaction_columns";

function count_tag(html: string, tag: string): number {
  return [...html.matchAll(new RegExp(`<${tag}\\b`, "gi"))].length;
}

function sample_row(index: number): TransactionTableRow {
  return {
    date: "2026-01-15",
    txn_type: "purchase",
    detail: "Posted 14 Jan",
    description: "Sample merchant line for ledger grid test",
    in_sen: 0,
    out_sen: 1250,
    balance_sen: 998_750,
    in_micro: 0,
    out_micro: 0,
    balance_micro: 0,
    sort_id: index,
  };
}

describe("DataTable ledger markup", () => {
  for (const kind of ["bank", "credit_card"] as const) {
    it(`${kind}: th, col, and td counts match column definitions`, () => {
      const columns = transaction_columns(kind);
      const rows = [sample_row(0), sample_row(1)];
      const html = renderToStaticMarkup(
        createElement(DataTable<TransactionTableRow>, {
          label: "Test ledger",
          scope: "test",
          columns,
          rows,
          inset: false,
        }),
      );

      const col_count = count_tag(html, "col");
      const thead = html.match(/<thead[\s\S]*?<\/thead>/)?.[0] ?? "";
      const th_count = (thead.match(/<th\b/g) ?? []).length;
      const body_html = html.match(/<tbody[\s\S]*?<\/tbody>/)?.[0] ?? "";
      const td_count = (body_html.match(/<td\b/g) ?? []).length;

      expect(col_count).toBe(columns.length);
      expect(th_count).toBe(columns.length);
      expect(td_count).toBe(columns.length * rows.length);
      expect(th_count).toBe(td_count / rows.length);
    });
  }

  it("description cells do not nest an extra table cell", () => {
    const columns = transaction_columns("credit_card");
    const rows = [sample_row(0)];
    const html = renderToStaticMarkup(
      createElement(DataTable<TransactionTableRow>, {
        label: "Test",
        scope: "test",
        columns,
        rows,
        inset: false,
      }),
    );
    const tbody = html.match(/<tbody[\s\S]*?<\/tbody>/)?.[0] ?? "";
    const row_match = tbody.match(/<tr[^>]*>[\s\S]*?<\/tr>/);
    expect(row_match).toBeTruthy();
    const row_html = row_match?.[0] ?? "";
    const td_chunks = [...row_html.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)];
    expect(td_chunks.length).toBe(columns.length);
    const description_index = columns.findIndex((c) => c.key === "description");
    const desc_inner = td_chunks[description_index]?.[1] ?? "";
    expect(desc_inner).not.toMatch(/<td\b/i);
    expect(desc_inner).not.toMatch(/<table\b/i);
    expect(desc_inner).toMatch(/<div class="line-clamp-3/);
  });
});