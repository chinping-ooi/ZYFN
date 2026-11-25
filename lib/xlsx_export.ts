import ExcelJS from "exceljs";
import type { DataTableColumn } from "@/components/data_table/types";
import { minor_to_major, type MinorAmount } from "@/lib/money";
import { MICRO_PER_RM, type MicroAmount } from "@/lib/tng/money_micro";

const HEADER_FILL = "FFEDF0F4";
const BORDER_COLOR = "FFE2E8F0";
const MONEY_FORMAT = "#,##0.00";
const MONEY_MICRO_FORMAT = "#,##0.0000";
const DATE_FORMAT = "dd mmm yyyy";

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: BORDER_COLOR } },
  left: { style: "thin", color: { argb: BORDER_COLOR } },
  bottom: { style: "thin", color: { argb: BORDER_COLOR } },
  right: { style: "thin", color: { argb: BORDER_COLOR } },
};

function column_width<T>(col: DataTableColumn<T>): number {
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
  return 14;
}

function sheet_title(label: string): string {
  const clean = label.replace(/[\\/*?:\[\]]/g, " ").trim();
  return (clean || "Export").slice(0, 31);
}

function parse_row_date(
  raw: unknown,
  time_zone?: string,
): Date | null {
  if (raw == null || raw === "") return null;
  const text = String(raw);
  const instant = text.includes("T")
    ? new Date(text)
    : new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(instant.getTime())) return null;
  if (time_zone === "Asia/Kuala_Lumpur" && !text.includes("T")) {
    return new Date(`${text}T00:00:00+08:00`);
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
    width: column_width(col),
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
        const parsed = parse_row_date(raw, col.time_zone);
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