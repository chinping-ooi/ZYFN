import { describe, expect, it } from "vitest";
import { overview_includes_fd_slice } from "@/lib/wallets/overview";

describe("overview_includes_fd_slice", () => {
  it("is false for TNG wallet and credit card kinds", () => {
    expect(overview_includes_fd_slice("tng_combined")).toBe(false);
    expect(overview_includes_fd_slice("tng_wallet")).toBe(false);
    expect(overview_includes_fd_slice("tng_go_plus")).toBe(false);
    expect(overview_includes_fd_slice("credit_card")).toBe(false);
    expect(overview_includes_fd_slice("mbb_2_gold_combined")).toBe(false);
  });

  it("is true for bank savings only", () => {
    expect(overview_includes_fd_slice("bank")).toBe(true);
  });
});