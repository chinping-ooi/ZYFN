import type { WorkbookData, WorkbookResult } from "@/lib/workbook/types";

export function is_workbook_data(
  result: WorkbookResult,
): result is WorkbookData {
  return "hlb" in result;
}