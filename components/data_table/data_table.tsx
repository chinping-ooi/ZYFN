"use client";

import { useMemo, useState } from "react";
import type { DataTableColumn, SortDirection } from "@/components/data_table/types";
import { compare_rows, display_cell } from "@/components/data_table/display";
import { ExportDialog } from "@/components/data_table/export_dialog";
import { StatusBadge } from "@/components/status_badge";

const PAGE_SIZES = [25, 50, 100, 200] as const;

const EMPTY_COLUMNS: DataTableColumn<Record<string, unknown>>[] = [];

type Props<T extends Record<string, unknown>> = {
  label: string;
  scope: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  date_key?: keyof T & string;
  toolbar_in_header?: boolean;
  empty_period_message?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  label,
  scope,
  columns,
  rows,
  date_key,
  toolbar_in_header = false,
  empty_period_message = "No records in this period.",
}: Props<T>) {
  const safe_columns = columns ?? EMPTY_COLUMNS;
  const safe_rows = Array.isArray(rows) ? rows : [];
  const resolved_date_key = date_key ?? ("date" as keyof T & string);

  const [search, set_search] = useState("");
  const [page, set_page] = useState(1);
  const [page_size, set_page_size] = useState<number | "all">(25);
  const [sort_key, set_sort_key] = useState<string | null>(null);
  const [sort_direction, set_sort_direction] =
    useState<SortDirection>("ascending");
  const [export_open, set_export_open] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    let result = safe_rows.filter((row) =>
      safe_columns.some((column) => {
        const raw = row[column.key];
        const display = display_cell(row, column);
        return `${raw ?? ""} ${display}`.toLocaleLowerCase().includes(query);
      }),
    );
    const column = safe_columns.find((c) => c.key === sort_key);
    if (column) {
      const dir = sort_direction === "ascending" ? 1 : -1;
      result = [...result].sort((a, b) => compare_rows(a, b, column, dir));
    }
    return result;
  }, [safe_rows, safe_columns, search, sort_key, sort_direction]);

  const page_count =
    page_size === "all"
      ? 1
      : Math.max(1, Math.ceil(filtered.length / page_size));
  const safe_page = Math.min(page, page_count);
  const start = page_size === "all" ? 0 : (safe_page - 1) * page_size;
  const visible =
    page_size === "all"
      ? filtered
      : filtered.slice(start, start + page_size);

  function toggle_sort(key: string) {
    if (sort_key === key) {
      set_sort_direction((d) =>
        d === "ascending" ? "descending" : "ascending",
      );
    } else {
      set_sort_key(key);
      set_sort_direction("ascending");
    }
    set_page(1);
  }

  const toolbar = (
    <div className="flex items-center justify-end gap-2.5">
      <input
        type="search"
        aria-label={`Search ${label}`}
        placeholder="Search all columns"
        className="h-9 w-[270px] max-w-full rounded-[3px] border border-[#b8c2cf] px-3 text-sm text-zyfn-ink"
        value={search}
        onChange={(e) => {
          set_search(e.target.value);
          set_page(1);
        }}
      />
      <button
        type="button"
        className="page-btn"
        onClick={() => set_export_open(true)}
      >
        Export
      </button>
    </div>
  );

  if (safe_columns.length === 0) {
    return (
      <p className="text-sm text-zyfn-muted" role="alert">
        Table columns are not configured.
      </p>
    );
  }

  return (
    <>
      {!toolbar_in_header ? toolbar : null}
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse border border-zyfn-line"
          aria-label={label}
        >
          <thead>
            <tr>
              {safe_columns.map((column) => {
                const numeric = ["money", "money_micro", "rate", "months"].includes(
                  column.type ?? "",
                );
                const sort =
                  sort_key === column.key ? sort_direction : "none";
                const next =
                  sort === "ascending" ? "descending" : "ascending";
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={sort === "none" ? undefined : sort}
                    className={`border border-zyfn-line bg-[#edf0f4] p-0 text-[13px] font-semibold text-[#435168] ${
                      numeric ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      className="sort-btn"
                      aria-label={`Sort ${column.label} ${next}`}
                      onClick={() => toggle_sort(column.key)}
                    >
                      {column.label}
                      <span
                        className="sort-indicator"
                        data-direction={sort}
                        aria-hidden
                      />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr
                key={index}
                className="even:bg-[#fafbfc] hover:bg-[#f0f3f7]"
              >
                {safe_columns.map((column) => {
                  const numeric = ["money", "money_micro", "rate", "months"].includes(
                    column.type ?? "",
                  );
                  const raw = row[column.key];
                  return (
                    <td
                      key={column.key}
                      className={`border border-zyfn-line px-[13px] py-[11px] text-sm whitespace-nowrap ${
                        numeric ? "text-right tabular-nums" : "text-left"
                      } ${column.className ?? ""}`}
                    >
                      {column.type === "status" ? (
                        <StatusBadge status={String(raw)} />
                      ) : (
                        display_cell(row, column)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(safe_columns.length, 1)}
                  className="border border-zyfn-line px-[13px] py-[30px] text-center text-zyfn-muted"
                >
                  {safe_rows.length
                    ? "No matching records."
                    : empty_period_message}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-4 text-[13px] text-zyfn-muted">
        <span role="status">
          {filtered.length
            ? `${start + 1}–${start + visible.length} of ${filtered.length} records`
            : `0–0 of 0 records`}
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-2">
            Rows per page
            <span className="relative inline-block">
              <select
                className="h-9 min-w-[80px] appearance-none rounded-[3px] border border-[#b8c2cf] bg-white pr-8 pl-2 text-sm"
                value={String(page_size)}
                onChange={(e) => {
                  const v = e.target.value;
                  set_page_size(v === "all" ? "all" : Number(v));
                  set_page(1);
                }}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                <option value="all">All</option>
              </select>
              <span className="pointer-events-none absolute top-2 right-2 text-zyfn-muted">
                ⌄
              </span>
            </span>
          </label>
          <button
            type="button"
            className="page-btn"
            disabled={safe_page <= 1}
            onClick={() => set_page((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="min-w-[75px] text-center">
            Page {safe_page} of {page_count}
          </span>
          <button
            type="button"
            className="page-btn"
            disabled={safe_page >= page_count}
            onClick={() => set_page((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
      <ExportDialog
        open={export_open}
        onClose={() => set_export_open(false)}
        label={label}
        scope={scope}
        columns={safe_columns}
        rows={filtered}
        date_key={resolved_date_key}
      />
    </>
  );
}

export function DataTableToolbarSlot({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}