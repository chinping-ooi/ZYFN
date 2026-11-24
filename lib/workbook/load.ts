import { existsSync, readFileSync } from "fs";
import { join } from "path";
import * as XLSX from "xlsx";
import { unstable_noStore as noStore } from "next/cache";
import { parse_account_sheet } from "@/lib/workbook/parse_sheet";
import type { WorkbookResult } from "@/lib/workbook/types";

export const TRANSACTION_WORKBOOK_FILE = "Transaction.xlsx";

function workbook_path(): string {
  const override = process.env.TRANSACTION_XLSX_PATH?.trim();
  if (override) return override;
  return join(process.cwd(), TRANSACTION_WORKBOOK_FILE);
}

export function load_transaction_workbook(): WorkbookResult {
  noStore();

  const path = workbook_path();
  if (!existsSync(path)) {
    return {
      kind: "missing",
      message:
        "Transaction.xlsx was not found at the repository root. Add the workbook locally to load HLB and Public Bank data.",
    };
  }

  try {
    const buffer = readFileSync(path);
    const workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true,
      // 1900 system; do not read “PBE 6-11”.
    });

    const hlb = parse_account_sheet(
      workbook,
      "HLB",
      "hong_leong",
      "Hong Leong Bank",
    );
    const pbe = parse_account_sheet(
      workbook,
      "PBE",
      "public_bank",
      "Public Bank",
    );

    return {
      source: "Transaction.xlsx",
      loaded_at: new Date().toISOString(),
      hlb,
      pbe,
    };
  } catch (error) {
    return {
      kind: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not read Transaction.xlsx.",
    };
  }
}