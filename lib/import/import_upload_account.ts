import type { ImportParsedAccount } from "@/lib/import/types";
import type { ImportSourceKind } from "@/lib/import/types";

export function should_show_detected_upload_accounts(options: {
  has_file: boolean;
  source_kind: ImportSourceKind | null;
  detected_accounts: ImportParsedAccount[];
  account_select_override: boolean;
}): boolean {
  if (!options.has_file || options.source_kind !== "pdf") return false;
  if (options.account_select_override) return false;
  return options.detected_accounts.length > 0;
}

export function should_show_upload_account_select(options: {
  has_file: boolean;
  source_kind: ImportSourceKind | null;
  detected_accounts: ImportParsedAccount[];
  account_select_override: boolean;
}): boolean {
  if (!options.has_file) return false;
  if (options.source_kind === "excel" || options.source_kind === "csv") {
    return true;
  }
  if (options.source_kind !== "pdf") return false;
  if (options.account_select_override) return true;
  return options.detected_accounts.length === 0;
}