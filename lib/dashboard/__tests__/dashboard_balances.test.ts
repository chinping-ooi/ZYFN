import { describe, expect, it } from "vitest";
import { sum_dashboard_balance_rows_sen } from "@/lib/dashboard/dashboard_balances";
import type { DashboardBalanceRow } from "@/lib/dashboard/dashboard_balances";

describe("sum_dashboard_balance_rows_sen", () => {
  it("sums row balances in integer sen", () => {
    const rows: DashboardBalanceRow[] = [
      { id: "a", name: "A", sub_label: "", balance_sen: 100_50 },
      { id: "b", name: "B", sub_label: "", balance_sen: 250_25 },
      { id: "c", name: "C", sub_label: "", balance_sen: 1_00 },
    ];
    expect(sum_dashboard_balance_rows_sen(rows)).toBe(351_75);
  });
});