import ExcelJS from "exceljs";
import type { DataTableColumn } from "@/components/data_table/types";
import { display_cell } from "@/components/data_table/display";
import { minor_to_major, type MinorAmount } from "@/lib/money";
import { MICRO_PER_RM, type MicroAmount } from "@/lib/tng/money_micro";

const HEADER_FILL = "FFEDF0F4";
const BORDER_COLOR = "FFE2E8F0";
const MONEY_FORMAT = "#,##0.00";
const MONEY_MICRO_FORMAT = "#,##0.0000";
const DATE_FORMAT = "dd mmm yyyy";
const MAX_COLUMN_WIDTH = 60;
const MIN_COLUMN_WIDTH = 8;

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: BORDER_COLOR } },
  left: { style: "thin", color: { argb: BORDER_COLOR } },
  bottom: { style: "thin", color: { argb: BORDER_COLOR } },
  right: { style: "thin", color: { argb: BORDER_COLOR } },
};

function column_width_floor<T>(col: DataTableColumn<T>): number {
  if (col.type === "date" || col.key === "date" || col.key === "start_date" || col.key === "maturity_date") {
    return 12;
  }
  if (col.key === "txn_type" || col.key === "type") return 12;
  if (col.key === "detail") return 28;
  if (col.key === "description") return 45;
  if (col.type === "money" || col.type === "money_micro") return 14;
  if (col.key === "principal_sen" || col.key === "interest_earned_sen") return 14;
  if (col.key === "receipt_no") return 14;
  if (col.key === "status_label" || col.type === "status") return 12;
  if (col.key === "import_status") return 17;
  if (col.key === "status_hint") return 50;
  return 14;
}

function sheet_title(label: string): string {
  const clean = label.replace(/[\\/*?:\[\]]/g, " ").trim();
  return (clean || "Export").slice(0, 31);
}

/**
 * Calendar date for Excel serials — YYYY-MM-DD and UI date columns use the
 * printed day (no UTC−8 shift). Shared by statement and import preview exports.
 */
export function parse_calendar_date_for_xlsx(
  raw: unknown,
  time_zone?: string,
): Date | null {
  if (raw == null || raw === "") return null;
  const text = String(raw);
  const iso = text.slice(0, 10);
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (parts && !text.includes("T")) {
    const year = Number(parts[1]);
    const month = Number(parts[2]);
    const day = Number(parts[3]);
    void time_zone;
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
  const instant = new Date(text);
  if (Number.isNaN(instant.getTime())) return null;
  if (time_zone) {
    const formatted = new Intl.DateTimeFormat("en-CA", {
      timeZone: time_zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(instant);
    const year = Number(formatted.find((p) => p.type === "year")?.value);
    const month = Number(formatted.find((p) => p.type === "month")?.value);
    const day = Number(formatted.find((p) => p.type === "day")?.value);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
  return instant;
}

function money_cell_value(
  raw: unknown,
  column: DataTableColumn<Record<string, unknown>>,
): number | null {
  if (raw === null || raw === undefined) return null;
  const minor = raw as MinorAmount;
  if (column.zero_as_blank && minor === 0) return null;
  return minor_to_major(minor);
}

function money_micro_cell_value(
  raw: unknown,
  column: DataTableColumn<Record<string, unknown>>,
): number | null {
  if (raw === null || raw === undefined) return null;
  const micro = raw as MicroAmount;
  if (column.zero_as_blank && micro === 0) return null;
  return micro / MICRO_PER_RM;
}

function export_cell_display_text<T extends Record<string, unknown>>(
  row: T,
  column: DataTableColumn<T>,
): string {
  return display_cell(row, column);
}

/** Widths in Excel character units, capped at {@link MAX_COLUMN_WIDTH}. */
export function compute_export_column_widths<T extends Record<string, unknown>>(
  columns: DataTableColumn<T>[],
  rows: T[],
): number[] {
  return columns.map((col) => {
    let max_len = col.label.length;
    const floor = column_width_floor(col);
    for (const row of rows) {
      const text = export_cell_display_text(row, col);
      max_len = Math.max(max_len, text.length);
    }
    return Math.min(
      MAX_COLUMN_WIDTH,
      Math.max(MIN_COLUMN_WIDTH, floor, max_len + 1),
    );
  });
}

export function export_date_range(
  period: "week" | "month" | "year" | "custom",
  anchor_iso: string,
  custom_start?: string,
  custom_end?: string,
): [string, string] {
  switch (period) {
    case "week": {
      const monday = new Date(anchor_iso + "T00:00:00Z");
      monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
      const sunday = new Date(monday);
      sunday.setUTCDate(sunday.getUTCDate() + 6);
      return [monday.toISOString().slice(0, 10), sunday.toISOString().slice(0, 10)];
    }
    case "month": {
      const month = anchor_iso.slice(0, 7);
      const end = new Date(month + "-01T00:00:00Z");
      end.setUTCMonth(end.getUTCMonth() + 1, 0);
      return [month + "-01", end.toISOString().slice(0, 10)];
    }
    case "year": {
      const year = anchor_iso.slice(0, 4);
      return [`${year}-01-01`, `${year}-12-31`];
    }
    default:
      return [custom_start ?? "", custom_end ?? ""];
  }
}

export async function build_and_download_xlsx<T extends Record<string, unknown>>(
  filename: string,
  sheet_label: string,
  columns: DataTableColumn<T>[],
  rows: T[],
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ZYFN";
  const sheet = workbook.addWorksheet(sheet_title(sheet_label));

  sheet.columns = columns.map((col) => ({
    key: col.key,
    width: column_width_floor(col),
  }));

  const header = sheet.addRow(columns.map((col) => col.label));
  header.height = 20;
  header.eachCell((cell) => {
    cell.font = { bold: true, size: 11, color: { argb: "FF435168" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL },
    };
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle" };
  });

  for (const row of rows) {
    const data_row = sheet.addRow([]);
    columns.forEach((col, index) => {
      const cell = data_row.getCell(index + 1);
      const raw = row[col.key as keyof T];
      cell.border = THIN_BORDER;

      if (col.type === "date") {
        const parsed = parse_calendar_date_for_xlsx(raw, col.time_zone);
        if (parsed) {
          cell.value = parsed;
          cell.numFmt = DATE_FORMAT;
        }
        return;
      }

      if (col.type === "money") {
        const amount = money_cell_value(
          raw,
          col as DataTableColumn<Record<string, unknown>>,
        );
        if (amount !== null) {
          cell.value = amount;
          cell.numFmt = MONEY_FORMAT;
          cell.alignment = { horizontal: "right" };
        }
        return;
      }

      if (col.type === "money_micro") {
        const amount = money_micro_cell_value(
          raw,
          col as DataTableColumn<Record<string, unknown>>,
        );
        if (amount !== null) {
          cell.value = amount;
          const account_key = col.account_key ?? "account";
          const account = String(row[account_key as keyof T] ?? "wallet");
          cell.numFmt =
            account === "go_plus" ? MONEY_MICRO_FORMAT : MONEY_FORMAT;
          cell.alignment = { horizontal: "right" };
        }
        return;
      }

      if (col.type === "rate" || col.type === "percent") {
        if (raw !== null && raw !== undefined && raw !== "") {
          cell.value = Number(raw) / 100;
          cell.numFmt = "0.00%";
        }
        return;
      }

      if (raw === null || raw === undefined) return;
      cell.value = String(raw);
    });
  }

  const widths = compute_export_column_widths(columns, rows);
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  sheet.views = [{ state: "frozen", ySplit: 1, topLeftCell: "A2", activeCell: "A2" }];
  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}