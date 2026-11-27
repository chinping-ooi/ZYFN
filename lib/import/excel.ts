import ExcelJS from "exceljs";
import {
  parse_amount_cell,
  row_money_from_direction,
} from "@/lib/import/institutions/spreadsheet/amount";
import type { NormalizedImportRow, SpreadsheetColumnMapping } from "@/lib/import/types";
import { detect_column_mapping } from "@/lib/import/spreadsheet_mapping";

function cell_to_string(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text: string }).text);
  }
  return String(value).trim();
}

function normalize_date(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
  const dmy = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, "0");
    const month = dmy[2].padStart(2, "0");
    let year = dmy[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }
  return t.slice(0, 10);
}

function rows_from_matrix(
  headers: string[],
  matrix: string[][],
  mapping: SpreadsheetColumnMapping,
): NormalizedImportRow[] {
  const rows: NormalizedImportRow[] = [];
  let index = 0;
  for (const line of matrix) {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = line[i] ?? "";
    });
    const date = normalize_date(record[mapping.date] ?? "");
    if (!date) continue;
    const debit = mapping.debit ? parse_amount_cell(record[mapping.debit]) : "0.00";
    const credit = mapping.credit
      ? parse_amount_cell(record[mapping.credit])
      : "0.00";
    let direction: "in" | "out" = "out";
    let amount_major = debit;
    if (Number(credit) > 0 && Number(debit) === 0) {
      direction = "in";
      amount_major = credit;
    } else if (Number(debit) > 0) {
      direction = "out";
      amount_major = debit;
    } else if (Number(credit) > 0) {
      direction = "in";
      amount_major = credit;
    }
    if (Number(amount_major) === 0) continue;
    const balance_major = mapping.balance
      ? parse_amount_cell(record[mapping.balance])
      : amount_major;
    const description =
      record[mapping.description] ??
      record[mapping.detail ?? ""] ??
      "Imported transaction";
    const money = row_money_from_direction(direction, amount_major, balance_major);
    rows.push({
      temp_id: `imp-${index++}`,
      txn_at: `${date}T00:00:00Z`,
      description: description.trim(),
      detail: (mapping.detail ? record[mapping.detail] : "")?.trim() ?? "",
      txn_type: (mapping.txn_type ? record[mapping.txn_type] : "")?.trim() ?? "",
      direction,
      amount_major,
      balance_after_major: balance_major,
      ...money,
      status: "new",
      review_reasons: [],
    });
  }
  return rows;
}

export async function parse_excel_buffer(
  buffer: ArrayBuffer,
  mapping?: SpreadsheetColumnMapping,
): Promise<{ headers: string[]; mapping: SpreadsheetColumnMapping; rows: NormalizedImportRow[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { headers: [], mapping: mapping ?? { date: "", description: "" }, rows: [] };
  }
  const header_row = sheet.getRow(1);
  const headers: string[] = [];
  header_row.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col - 1] = cell_to_string(cell.value) || `Column ${col}`;
  });
  const resolved_mapping = mapping ?? detect_column_mapping(headers);
  const matrix: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row, row_number) => {
    if (row_number === 1) return;
    const line: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      line[col - 1] = cell_to_string(cell.value);
    });
    matrix.push(line);
  });
  const rows = rows_from_matrix(headers, matrix, resolved_mapping);
  return { headers, mapping: resolved_mapping, rows };
}

export function parse_csv_text(
  text: string,
  mapping?: SpreadsheetColumnMapping,
): { headers: string[]; mapping: SpreadsheetColumnMapping; rows: NormalizedImportRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], mapping: mapping ?? { date: "", description: "" }, rows: [] };
  }
  const headers = lines[0].split(",").map((h) => h.trim());
  const matrix = lines.slice(1).map((l) => l.split(",").map((c) => c.trim()));
  const resolved_mapping = mapping ?? detect_column_mapping(headers);
  const rows = rows_from_matrix(headers, matrix, resolved_mapping);
  return { headers, mapping: resolved_mapping, rows };
}