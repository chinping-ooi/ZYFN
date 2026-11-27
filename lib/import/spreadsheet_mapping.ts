import type { SpreadsheetColumnMapping } from "@/lib/import/types";

const STORAGE_PREFIX = "zyfn_import_mapping_";

export function mapping_storage_key(account_ref: string): string {
  return `${STORAGE_PREFIX}${account_ref}`;
}

export function load_column_mapping(
  account_ref: string,
): SpreadsheetColumnMapping | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(mapping_storage_key(account_ref));
    return raw ? (JSON.parse(raw) as SpreadsheetColumnMapping) : null;
  } catch {
    return null;
  }
}

export function save_column_mapping(
  account_ref: string,
  mapping: SpreadsheetColumnMapping,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    mapping_storage_key(account_ref),
    JSON.stringify(mapping),
  );
}

const DATE_HEADERS = [/date/i, /txn/i, /posting/i];
const DESC_HEADERS = [/description/i, /particular/i, /narration/i, /details/i];
const DETAIL_HEADERS = [/detail/i, /reference/i, /ref/i];
const TYPE_HEADERS = [/type/i, /category/i];
const DEBIT_HEADERS = [/debit/i, /withdraw/i, /out/i, /payment/i];
const CREDIT_HEADERS = [/credit/i, /deposit/i, /in/i];
const BALANCE_HEADERS = [/balance/i];

function match_header(headers: string[], patterns: RegExp[]): string | undefined {
  return headers.find((h) => patterns.some((p) => p.test(h)));
}

export function detect_column_mapping(
  headers: string[],
): SpreadsheetColumnMapping {
  return {
    date: match_header(headers, DATE_HEADERS) ?? headers[0] ?? "",
    description:
      match_header(headers, DESC_HEADERS) ??
      headers.find((h) => h !== headers[0]) ??
      "",
    detail: match_header(headers, DETAIL_HEADERS),
    txn_type: match_header(headers, TYPE_HEADERS),
    debit: match_header(headers, DEBIT_HEADERS),
    credit: match_header(headers, CREDIT_HEADERS),
    balance: match_header(headers, BALANCE_HEADERS),
  };
}