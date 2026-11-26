import { describe, expect, it } from "vitest";
import { overview_includes_fd_slice } from "@/lib/wallets/overview";

describe("overview_includes_fd_slice", () => {
  it("is false for TNG wallet account kinds", () => {
    expect(overview_includes_fd_slice("tng_combined")).toBe(false);
    expect(overview_includes_fd_slice("tng_wallet")).toBe(false);
    expect(overview_includes_fd_slice("tng_go_plus")).toBe(false);
  });

  it("is true for bank accounts", () => {
    expect(overview_includes_fd_slice("bank")).toBe(true);
    expect(overview_includes_fd_slice("credit_card")).toBe(true);
  });
});