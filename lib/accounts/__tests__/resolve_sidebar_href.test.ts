import { describe, expect, it } from "vitest";
import {
  is_account_hub_nav_href,
  resolve_sidebar_account_href,
} from "@/lib/accounts/resolve_sidebar_href";
import { WALLET_HREF } from "@/lib/wallets/routes";

describe("resolve_sidebar_account_href", () => {
  it("uses statement path when view is statement", () => {
    expect(
      resolve_sidebar_account_href(
        "/transactions/maybank",
        "statement",
        "month=2026-10",
      ),
    ).toBe("/transactions/maybank/statement?month=2026-10");
  });

  it("uses summary base when view is summary", () => {
    expect(
      resolve_sidebar_account_href("/transactions/maybank", "summary", null),
    ).toBe("/transactions/maybank");
  });

  it("leaves wallet top-level on summary base regardless of view", () => {
    expect(
      resolve_sidebar_account_href(WALLET_HREF, "statement", "month=2026-09"),
    ).toBe(`${WALLET_HREF}?month=2026-09`);
  });

  it("applies statement path for MBB 2 Gold card hubs", () => {
    expect(
      resolve_sidebar_account_href(
        "/credit-cards/mbb-2-gold/1697",
        "statement",
        null,
      ),
    ).toBe("/credit-cards/mbb-2-gold/1697/statement");
  });

  it("detects account hub hrefs", () => {
    expect(is_account_hub_nav_href("/transactions/pbe")).toBe(true);
    expect(is_account_hub_nav_href("/fixed-deposits")).toBe(false);
    expect(is_account_hub_nav_href("/import")).toBe(false);
  });
});