import { IMPORT_STATUS_CHIP_LABELS } from "@/lib/import/import_labels";
import type { NormalizedImportRow } from "@/lib/import/types";

/** Row badges and review summary chips share these surfaces. */
export const IMPORT_STATUS_SURFACE: Record<
  NormalizedImportRow["status"],
  string
> = {
  new: "border border-[#bfd2c7] bg-[#f1f7f4] text-[#276b54]",
  duplicate:
    "border border-zyfn-red/60 bg-[#fffbfb] text-zyfn-red",
  needs_review:
    "border border-amber-500/75 bg-amber-50/50 text-amber-800",
};

const LABEL_TO_STATUS: Record<string, NormalizedImportRow["status"]> = {
  [IMPORT_STATUS_CHIP_LABELS.new.toLowerCase()]: "new",
  [IMPORT_STATUS_CHIP_LABELS.duplicate.toLowerCase()]: "duplicate",
  [IMPORT_STATUS_CHIP_LABELS.needs_review.toLowerCase()]: "needs_review",
};

export function import_status_surface_for_label(
  label: string,
): string | undefined {
  const status = LABEL_TO_STATUS[label.toLowerCase()];
  return status ? IMPORT_STATUS_SURFACE[status] : undefined;
}