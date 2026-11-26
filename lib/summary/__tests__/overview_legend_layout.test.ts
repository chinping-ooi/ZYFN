import { describe, expect, it } from "vitest";
import type { TxnTypeBreakdownRow } from "@/lib/transactions/type_breakdown";
import { OVERVIEW_LEGEND_LAYOUT } from "@/components/summary_breakdown_legend";

/** Synthetic Overview slices (in / out / FD) for layout wiring checks. */
const synthetic_overview_rows: TxnTypeBreakdownRow[] = [
  {
    type_key: "in",
    label: "Total in",
    amount_sen: 120_000,
    amount_micro: 0,
    count: 3,
    pct: 40,
  },
  {
    type_key: "out",
    label: "Total out",
    amount_sen: 80_478,
    amount_micro: 0,
    count: 5,
    pct: 36.8,
  },
  {
    type_key: "fd",
    label: "FD",
    amount_sen: 200_000,
    amount_micro: 0,
    count: 1,
    pct: 23.2,
  },
];

describe("Overview legend layout", () => {
  it("uses the horizontal Overview-only layout token", () => {
    expect(OVERVIEW_LEGEND_LAYOUT).toBe("overview_horizontal");
  });

  it("synthetic three-slice Overview data includes FD row", () => {
    expect(synthetic_overview_rows).toHaveLength(3);
    expect(synthetic_overview_rows[2]?.label).toBe("FD");
  });
});