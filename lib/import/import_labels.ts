import type { NormalizedImportRow } from "@/lib/import/types";

export const PARSER_DISPLAY_NAMES: Record<string, string> = {
  pbe_card: "Public Bank credit card",
  pbe_savings: "Public Bank savings",
  pbe: "Public Bank statement",
  maybank: "Maybank statement",
  mbb_savings: "Maybank savings",
  hlb: "Hong Leong Bank statement",
  mbb_card: "Maybank credit card",
  tng_text: "TNG eWallet export",
  generic: "Generic table",
};

export function parser_display_name(parser_id: string): string {
  return (
    PARSER_DISPLAY_NAMES[parser_id] ??
    parser_id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export const IMPORT_STATUS_CHIP_LABELS = {
  new: "New record",
  duplicate: "Existing record",
  needs_review: "Need check",
} as const;

export function import_row_status_label(
  status: NormalizedImportRow["status"],
): string {
  if (status === "duplicate") return IMPORT_STATUS_CHIP_LABELS.duplicate;
  if (status === "needs_review") return IMPORT_STATUS_CHIP_LABELS.needs_review;
  return IMPORT_STATUS_CHIP_LABELS.new;
}