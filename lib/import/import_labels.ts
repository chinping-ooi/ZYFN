import type { NormalizedImportRow } from "@/lib/import/types";

export const PARSER_DISPLAY_NAMES: Record<string, string> = {
  pbe_card: "Public Bank credit card",
  pbe: "Public Bank statement",
  maybank: "Maybank statement",
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

export function import_row_status_label(
  status: NormalizedImportRow["status"],
): string {
  if (status === "duplicate") return "Already saved";
  if (status === "needs_review") return "Please check";
  return "To be added";
}