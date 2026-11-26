"use client";

import { useCallback, useMemo, useState } from "react";
import type { DataTableColumn } from "@/components/data_table/types";
import { TableSelect } from "@/components/data_table/table_select";
import {
  build_export_filename as build_statement_export_filename,
} from "@/lib/export_filename";
import {
  build_and_download_xlsx,
  export_date_range,
} from "@/lib/xlsx_export";

type Props<T extends Record<string, unknown>> = {
  open: boolean;
  onClose: () => void;
  label: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  date_key: keyof T & string;
  export_all_rows?: boolean;
  resolve_export_filename?: (rows: T[]) => string;
};

export function ExportDialog<T extends Record<string, unknown>>({
  open,
  onClose,
  label,
  columns,
  rows,
  date_key,
  export_all_rows = false,
  resolve_export_filename,
}: Props<T>) {
  const anchor = useMemo(() => {
    const dates = rows
      .map((row) => String(row[date_key] ?? ""))
      .filter(Boolean)
      .sort();
    return dates.at(-1) ?? new Date().toISOString().slice(0, 10);
  }, [rows, date_key]);

  const [period, setPeriod] = useState<"week" | "month" | "year" | "custom">(
    "month",
  );
  const [anchor_value, set_anchor_value] = useState(anchor.slice(0, 7));
  const [week_date, set_week_date] = useState(anchor);
  const [year_value, set_year_value] = useState(anchor.slice(0, 4));
  const [custom_start, set_custom_start] = useState(anchor.slice(0, 7) + "-01");
  const [custom_end, set_custom_end] = useState(anchor);
  const [error, set_error] = useState("");
  const [exporting, set_exporting] = useState(false);

  const reset = useCallback(() => {
    set_error("");
    setPeriod("month");
    set_anchor_value(anchor.slice(0, 7));
    set_week_date(anchor);
    set_year_value(anchor.slice(0, 4));
    set_custom_start(anchor.slice(0, 7) + "-01");
    set_custom_end(anchor);
  }, [anchor]);

  if (!open) return null;

  const date_column = columns.find((c) => c.key === date_key);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    set_error("");
    set_exporting(true);
    try {
      let export_rows = rows;
      let filename: string;
      if (export_all_rows) {
        if (!rows.length) {
          throw new Error("No records to export.");
        }
        const dates = rows
          .map((row) => String(row[date_key] ?? ""))
          .filter(Boolean)
          .sort();
        const start = dates[0] ?? "";
        const end = dates.at(-1) ?? start;
        filename =
          resolve_export_filename?.(rows) ??
          build_statement_export_filename(label, start, end);
      } else {
        const period_anchor =
          period === "week"
            ? week_date
            : period === "year"
              ? year_value + "-06-01"
              : period === "month"
                ? anchor_value + "-01"
                : custom_end;
        const [start, end] = export_date_range(
          period,
          period_anchor,
          custom_start,
          custom_end,
        );
        if (!start || !end || start > end) {
          throw new Error(
            "Choose a valid date range with From on or before Through.",
          );
        }
        export_rows = rows.filter((row) => {
          const date = String(row[date_key] ?? "");
          return date && date >= start && date <= end;
        });
        if (!export_rows.length) {
          throw new Error("No matching records in this date range.");
        }
        filename = build_statement_export_filename(label, start, end);
      }
      await build_and_download_xlsx(filename, label, columns, export_rows);
      reset();
      onClose();
    } catch (err) {
      set_error(err instanceof Error ? err.message : "Export failed.");
    } finally {
      set_exporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#132238]/44 p-4">
      <div
        role="dialog"
        aria-label={`Export ${label}`}
        className="w-full max-w-[440px] rounded border border-zyfn-line bg-white p-6 text-zyfn-ink shadow-lg"
      >
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <h3 className="m-0 text-lg font-semibold">Export records</h3>
          <p className="m-0 text-[13px] text-zyfn-muted">
            {export_all_rows
              ? `Excel file includes all ${rows.length} parsed row${rows.length === 1 ? "" : "s"}.`
              : `Excel file includes matching records loaded in this table across all pages. Date field: ${date_column?.label ?? "unavailable"}. Weeks run Monday through Sunday.`}
          </p>
          {export_all_rows ? null : (
          <label className="flex flex-col gap-1.5 text-sm">
            Period
            <TableSelect
              className="h-9"
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof period)}
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="custom">Custom range</option>
            </TableSelect>
          </label>
          )}
          {!export_all_rows && period === "custom" ? (
            <div className="grid grid-cols-2 gap-3.5">
              <label className="flex flex-col gap-1.5 text-sm">
                From
                <input
                  type="date"
                  className="h-9 rounded-[3px] border border-[#b8c2cf] px-3 text-sm"
                  value={custom_start}
                  onChange={(e) => set_custom_start(e.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Through
                <input
                  type="date"
                  className="h-9 rounded-[3px] border border-[#b8c2cf] px-3 text-sm"
                  value={custom_end}
                  min={custom_start}
                  onChange={(e) => set_custom_end(e.target.value)}
                  required
                />
              </label>
            </div>
          ) : !export_all_rows && period === "week" ? (
            <label className="flex flex-col gap-1.5 text-sm">
              Date within week
              <input
                type="date"
                className="h-9 rounded-[3px] border border-[#b8c2cf] px-3 text-sm"
                value={week_date}
                onChange={(e) => set_week_date(e.target.value)}
                required
              />
            </label>
          ) : !export_all_rows && period === "year" ? (
            <label className="flex flex-col gap-1.5 text-sm">
              Year
              <input
                type="number"
                min={1900}
                max={9999}
                className="h-9 rounded-[3px] border border-[#b8c2cf] px-3 text-sm"
                value={year_value}
                onChange={(e) => set_year_value(e.target.value)}
                required
              />
            </label>
          ) : !export_all_rows ? (
            <label className="flex flex-col gap-1.5 text-sm">
              Month
              <input
                type="month"
                className="h-9 rounded-[3px] border border-[#b8c2cf] px-3 text-sm"
                value={anchor_value}
                onChange={(e) => set_anchor_value(e.target.value)}
                required
              />
            </label>
          ) : null}
          {error ? (
            <p className="m-0 text-[13px] text-zyfn-red" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              className="page-btn"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="page-btn bg-zyfn-navy text-white border-zyfn-navy"
              disabled={exporting}
            >
              {exporting ? "Exporting…" : "Export Excel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}