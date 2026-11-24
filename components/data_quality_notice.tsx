import type { ParsedSheet } from "@/lib/workbook/types";

export function DataQualityNotice({ sheets }: { sheets: ParsedSheet[] }) {
  const skipped = sheets.reduce((t, s) => t + s.skipped_rows.length, 0);
  const reconcile = sheets.reduce(
    (t, s) => t + s.reconcile_warning_count,
    0,
  );

  if (skipped === 0 && reconcile === 0) return null;

  return (
    <aside
      className="mb-5 rounded-[3px] border border-[#decea9] bg-[#faf6ec] px-4 py-3 text-sm text-[#805e23]"
      role="status"
    >
      {skipped > 0 ? (
        <span>
          {skipped} row{skipped === 1 ? "" : "s"} skipped while reading the
          workbook.
        </span>
      ) : null}
      {skipped > 0 && reconcile > 0 ? " " : null}
      {reconcile > 0 ? (
        <span>
          {reconcile} running-balance warning
          {reconcile === 1 ? "" : "s"} (balance ≠ previous ± amount).
        </span>
      ) : null}
    </aside>
  );
}