"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { DataTableColumn, SortDirection } from "@/components/data_table/types";
import {
  column_cell_class,
  column_header_class,
} from "@/components/data_table/column_layout";
import { visible_table_columns } from "@/components/data_table/visible_columns";
import { compare_rows, display_cell } from "@/components/data_table/display";
import { ExportDialog } from "@/components/data_table/export_dialog";
import {
  DataTableSkeleton,
  type DataTableSkeletonVariant,
} from "@/components/data_table/data_table_skeleton";
import { TableSelect } from "@/components/data_table/table_select";
import { StatusBadge } from "@/components/status_badge";
import {
  LEDGER_CELL_DIVIDER,
  LEDGER_HEAD_CELL,
} from "@/components/data_table/ledger_styles";

const PAGE_SIZES = [25, 50, 100, 200] as const;

const EMPTY_COLUMNS: DataTableColumn<Record<string, unknown>>[] = [];

const TABLE_CONTROL_BORDER = "border-[#b8c2cf]";

const pagination_icon_btn =
  `inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border ${TABLE_CONTROL_BORDER} bg-white text-zyfn-ink hover:bg-[#f8f9fb] disabled:cursor-default disabled:border-[#dce1e7] disabled:bg-[#f5f6f8] disabled:text-[#929baa]`;

type Props<T extends Record<string, unknown>> = {
  label: string;
  scope: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  date_key?: keyof T & string;
  toolbar_in_header?: boolean;
  empty_period_message?: string;
  /** When true (default), table sits inside an outer card without a second bordered panel. */
  inset?: boolean;
  table_layout?: "fixed" | "auto";
  /** Statement pages: grow into parent and scroll tbody only. */
  fill_height?: boolean;
  /** Slug source for Excel filename (defaults to `label`). */
  export_account_label?: string;
  loading?: boolean;
  skeleton_variant?: DataTableSkeletonVariant;
  skeleton_show_bank?: boolean;
};

export function DataTable<T extends Record<string, unknown>>({
  label,
  scope,
  columns,
  rows,
  date_key,
  toolbar_in_header = false,
  empty_period_message = "No records in this period.",
  inset = true,
  table_layout = "fixed",
  fill_height = false,
  export_account_label,
  loading = false,
  skeleton_variant = "transaction",
  skeleton_show_bank = false,
}: Props<T>) {
  void scope;
  const safe_columns = columns ?? EMPTY_COLUMNS;
  const labeled_columns = useMemo(
    () => visible_table_columns(safe_columns),
    [safe_columns],
  );
  const resolved_export_label = export_account_label ?? label;
  const safe_rows = useMemo(
    () => (Array.isArray(rows) ? rows : []),
    [rows],
  );
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
      labeled_columns.some((column) => {
        const raw = row[column.key];
        const display = display_cell(row, column);
        return `${raw ?? ""} ${display}`.toLocaleLowerCase().includes(query);
      }),
    );
    const column = labeled_columns.find((c) => c.key === sort_key);
    if (column) {
      const dir = sort_direction === "ascending" ? 1 : -1;
      result = [...result].sort((a, b) => compare_rows(a, b, column, dir));
    }
    return result;
  }, [safe_rows, labeled_columns, search, sort_key, sort_direction]);

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

  const body_pad = inset ? "px-4" : "px-0";

  const toolbar = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <input
        type="search"
        aria-label={`Search ${label}`}
        placeholder="Search all columns"
        className="h-9 w-full rounded-[3px] border border-[#b8c2cf] px-3 text-sm text-zyfn-ink sm:max-w-[min(100%,320px)] sm:flex-1"
        value={search}
        onChange={(e) => {
          set_search(e.target.value);
          set_page(1);
        }}
      />
      <button
        type="button"
        className="page-btn w-full sm:w-auto sm:shrink-0"
        onClick={() => set_export_open(true)}
      >
        Export
      </button>
    </div>
  );

  if (loading) {
    return (
      <DataTableSkeleton
        variant={skeleton_variant}
        fill_height={fill_height}
        show_bank_column={skeleton_show_bank}
      />
    );
  }

  if (labeled_columns.length === 0) {
    return (
      <p className="text-sm text-zyfn-muted" role="alert">
        Table columns are not configured.
      </p>
    );
  }

  return (
    <div
      className={`flex w-full flex-col ${
        fill_height ? "min-h-0 flex-1" : "min-h-0"
      }`}
    >
      {!toolbar_in_header ? (
        <div className={`data-table-toolbar shrink-0 pt-4 pb-3 ${body_pad}`}>
          {toolbar}
        </div>
      ) : null}
      <div
        className={`min-h-0 overflow-auto overscroll-contain rounded-[3px] border border-zyfn-line bg-white ${body_pad} ${
          fill_height
            ? "flex-1"
            : "max-h-[min(70vh,560px)]"
        }`}
      >
        <table
          className={`ledger-grid-table w-full min-w-[520px] border-collapse sm:min-w-[720px] ${
            table_layout === "fixed" ? "table-fixed" : "table-auto"
          }`}
          aria-label={label}
        >
          <colgroup>
            {labeled_columns.map((column) => (
              <col key={column.key} className={column_header_class(column)} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {labeled_columns.map((column) => {
                const numeric = ["money", "money_micro", "rate", "percent", "months"].includes(
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
                    className={`${LEDGER_HEAD_CELL} p-0 text-[13px] font-semibold text-[#435168] ${column_header_class(column)} ${
                      numeric ? "text-right" : "text-left"
                    }`}
                  >
                    <button
                      type="button"
                      className={`sort-btn ${numeric ? "flex-row-reverse text-right" : ""}`}
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
                className="even:bg-[#fafbfc] hover:bg-[#f0f3f7] last:[&>td]:border-b-0"
              >
                {labeled_columns.map((column) => {
                  const numeric = ["money", "money_micro", "rate", "percent", "months"].includes(
                    column.type ?? "",
                  );
                  const raw = row[column.key];
                  const text = display_cell(row, column);
                  return (
                    <td
                      key={column.key}
                      title={
                        column.key === "description"
                          ? String(text)
                          : column.key === "import_status" &&
                              typeof row.status_hint === "string" &&
                              row.status_hint.length > 0
                            ? row.status_hint
                            : undefined
                      }
                      className={`${LEDGER_CELL_DIVIDER} px-[13px] py-[11px] text-sm ${
                        numeric ? "text-right" : "text-left"
                      } ${column_cell_class(column)}`}
                    >
                      {column.type === "status" ? (
                        <StatusBadge status={String(raw)} />
                      ) : (
                        text
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(labeled_columns.length, 1)}
                  className={`${LEDGER_CELL_DIVIDER} px-[13px] py-[30px] text-center text-zyfn-muted`}
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
      <div
        className={`data-table-footer flex shrink-0 flex-wrap items-center justify-between gap-2 pt-3 pb-1 text-[13px] text-zyfn-muted ${body_pad}`}
      >
        <span role="status" className="leading-8">
          {filtered.length
            ? `${start + 1}–${start + visible.length} of ${filtered.length} records`
            : `0–0 of 0 records`}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 whitespace-nowrap">
            Rows per page
            <TableSelect
              wrapperClassName="min-w-[4.5rem]"
              className="h-8 px-2"
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
            </TableSelect>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={pagination_icon_btn}
              disabled={safe_page <= 1}
              aria-label="First page"
              title="First page"
              onClick={() => set_page(1)}
            >
              <ChevronsLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              className={pagination_icon_btn}
              disabled={safe_page <= 1}
              aria-label="Previous page"
              title="Previous page"
              onClick={() => set_page((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span
              className="min-w-[6.5rem] text-center text-sm leading-8 text-zyfn-ink"
              aria-live="polite"
            >
              Page {safe_page} of {page_count}
            </span>
            <button
              type="button"
              className={pagination_icon_btn}
              disabled={safe_page >= page_count}
              aria-label="Next page"
              title="Next page"
              onClick={() => set_page((p) => Math.min(page_count, p + 1))}
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              className={pagination_icon_btn}
              disabled={safe_page >= page_count}
              aria-label="Last page"
              title="Last page"
              onClick={() => set_page(page_count)}
            >
              <ChevronsRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
      <ExportDialog
        open={export_open}
        onClose={() => set_export_open(false)}
        label={resolved_export_label}
        columns={labeled_columns}
        rows={filtered}
        date_key={resolved_date_key}
      />
    </div>
  );
}