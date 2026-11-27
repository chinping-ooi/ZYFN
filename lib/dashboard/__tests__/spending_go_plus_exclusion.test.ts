import { describe, expect, it } from "vitest";
import { is_spending_breakdown_go_plus_row } from "@/lib/dashboard/spending_go_plus_exclusion";

describe("is_spending_breakdown_go_plus_row", () => {
  it("matches normalised GO+ txn_type labels", () => {
    expect(
      is_spending_breakdown_go_plus_row(
        {
          txn_type: "GO+ Cash Out",
          description: "Sample",
          detail: "",
        },
        "tng_wallet",
      ),
    ).toBe(true);
    expect(
      is_spending_breakdown_go_plus_row(
        {
          txn_type: "GO+ Daily Earnings",
          description: "Interest",
          detail: "",
        },
        "tng_go_plus",
      ),
    ).toBe(true);
  });

  it("matches wallet description marker for GO+ cash out", () => {
    expect(
      is_spending_breakdown_go_plus_row(
        {
          txn_type: "Payment",
          description: "GO+ Cash Out",
          detail: "",
          tng_sub_account: "wallet",
        },
        "tng_wallet",
      ),
    ).toBe(true);
  });
});