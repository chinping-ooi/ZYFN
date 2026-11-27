import { describe, expect, it } from "vitest";
import {
  filter_fixed_deposits_by_month,
  fixed_deposit_relevant_to_month,
} from "@/lib/fixed_deposits/month_filter";
import type { FixedDepositRecord } from "@/lib/fixed_deposits/types";

function row(overrides: Partial<FixedDepositRecord>): FixedDepositRecord {
  return {
    id: 1,
    account_id: 1,
    bank_code: "HLB",
    bank_label: "Hong Leong Bank",
    receipt_no: "R1",
    principal_major: 10_000,
    interest_rate: 3.2,
    start_date: "2025-01-15",
    maturity_date: "2025-07-15",
    interest_earned_major: null,
    status: 1,
    ...overrides,
  };
}

describe("fixed_deposit_relevant_to_month", () => {
  it("includes placements that start in the month", () => {
    const fd = row({ start_date: "2025-03-10", maturity_date: "2025-09-10" });
    expect(fixed_deposit_relevant_to_month(fd, "2025-03")).toBe(true);
    expect(fixed_deposit_relevant_to_month(fd, "2025-04")).toBe(true);
  });

  it("includes maturities in the month", () => {
    const fd = row({ start_date: "2024-06-01", maturity_date: "2025-08-20" });
    expect(fixed_deposit_relevant_to_month(fd, "2025-08")).toBe(true);
    expect(fixed_deposit_relevant_to_month(fd, "2024-05")).toBe(false);
  });

  it("includes terms that overlap the month without start or maturity in that month", () => {
    const fd = row({ start_date: "2025-01-01", maturity_date: "2025-12-31" });
    expect(fixed_deposit_relevant_to_month(fd, "2025-06")).toBe(true);
  });

  it("filter returns all rows for all months", () => {
    const rows = [
      row({ id: 1, start_date: "2025-01-01", maturity_date: "2025-03-01" }),
      row({ id: 2, start_date: "2025-09-01", maturity_date: "2025-11-01" }),
    ];
    expect(filter_fixed_deposits_by_month(rows, "all")).toHaveLength(2);
    expect(filter_fixed_deposits_by_month(rows, "2025-02")).toHaveLength(1);
  });
});