import { describe, expect, it } from "vitest";
import {
  is_account_hub_nav_href,
  resolve_sidebar_account_href,
} from "@/lib/accounts/resolve_sidebar_href";
import { flatten_nav_hrefs, NAV_GROUPS } from "@/lib/accounts/nav";
import { WALLET_HREF } from "@/lib/wallets/routes";

const ACCOUNT_HUB_HREFS = [
  ...flatten_nav_hrefs(NAV_GROUPS.flatMap((g) => g.items)),
  WALLET_HREF,
];

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

  it("routes wallet to statement when view is statement and keeps month query", () => {
    expect(
      resolve_sidebar_account_href(WALLET_HREF, "statement", "month=2026-09"),
    ).toBe(`${WALLET_HREF}/statement?month=2026-09`);
  });

  it("routes wallet to summary base when view is summary", () => {
    expect(
      resolve_sidebar_account_href(WALLET_HREF, "summary", "month=2026-09"),
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

  it.each(ACCOUNT_HUB_HREFS)(
    "statement preference appends /statement for %s",
    (href) => {
      expect(resolve_sidebar_account_href(href, "statement", null)).toBe(
        `${href.replace(/\/$/, "")}/statement`,
      );
    },
  );

  it.each(ACCOUNT_HUB_HREFS)(
    "summary preference keeps base path for %s",
    (href) => {
      expect(resolve_sidebar_account_href(href, "summary", null)).toBe(
        href.replace(/\/$/, ""),
      );
    },
  );
});