import type { TngLedgerRow } from "@/lib/tng/types";

export type DumpChronology = "asc" | "desc";

export type TngRowWithOrder = TngLedgerRow & { dump_order: number };

/** Intraday ordering aligned with coinflow `parse_tng.js` GO+ priorities, extended for wallet rows. */
export function intraday_priority(row: TngLedgerRow): number {
  if (row.type === "GO+ Daily Earnings") return 1;
  if (row.type === "GO+ Cash In") return 2;
  const desc = row.description.toLowerCase();
  if (desc.includes("quick reload payment")) return 90;
  if (row.direction === "in") return 40;
  if (row.direction === "out") return 50;
  if (row.direction === "transfer") return 60;
  return 70;
}

export function compare_tng_rows(
  a: TngRowWithOrder,
  b: TngRowWithOrder,
  dump_chronology: DumpChronology,
): number {
  const by_date = a.date.localeCompare(b.date);
  if (by_date !== 0) return by_date;

  const by_priority = intraday_priority(a) - intraday_priority(b);
  if (by_priority !== 0) return by_priority;

  if (dump_chronology === "desc") {
    return b.dump_order - a.dump_order;
  }
  return a.dump_order - b.dump_order;
}

export function sort_tng_rows(
  rows: TngRowWithOrder[],
  dump_chronology: DumpChronology,
): TngRowWithOrder[] {
  return [...rows].sort((a, b) => compare_tng_rows(a, b, dump_chronology));
}

export function detect_dump_chronology(
  row_dates_in_dump_order: string[],
): DumpChronology {
  if (row_dates_in_dump_order.length < 2) return "desc";

  let asc_steps = 0;
  let desc_steps = 0;
  for (let i = 1; i < row_dates_in_dump_order.length; i++) {
    const prev = row_dates_in_dump_order[i - 1];
    const cur = row_dates_in_dump_order[i];
    if (cur > prev) asc_steps += 1;
    if (cur < prev) desc_steps += 1;
  }

  const first = row_dates_in_dump_order[0];
  const last = row_dates_in_dump_order[row_dates_in_dump_order.length - 1];
  if (first > last) return "desc";
  if (first < last) return "asc";
  return desc_steps >= asc_steps ? "desc" : "asc";
}