import { describe, expect, it } from "vitest";
import {
  flatten_nav_hrefs,
  NAV_GROUPS,
  nav_item_has_active_descendant,
  nav_item_is_active,
  nav_item_is_marked,
  nav_item_route_emphasis,
  WALLET_HREF,
} from "@/lib/accounts/nav";

describe("account navigation", () => {
  it("exposes a single wallet hub href (no Wallets sidebar group)", () => {
    expect(WALLET_HREF).toBe("/transactions/touch-n-go");
    expect(NAV_GROUPS.find((g) => g.title === "Wallets")).toBeUndefined();
  });

  it("nests Visa and Amex under MBB 2 Gold in Credit cards", () => {
    const cards = NAV_GROUPS.find((g) => g.title === "Credit cards");
    expect(cards).toBeDefined();
    const gold = cards!.items.find((i) => i.label === "MBB 2 Gold");
    expect(gold?.href).toBe("/credit-cards/mbb-2-gold");
    expect(gold?.children?.map((c) => c.href)).toEqual([
      "/credit-cards/mbb-2-gold/1697",
      "/credit-cards/mbb-2-gold/8060",
    ]);
    const top_level_hrefs = cards!.items.map((i) => i.href);
    expect(top_level_hrefs).toContain("/credit-cards/mbb-2-gold");
    expect(top_level_hrefs).not.toContain("/credit-cards/mbb-2-gold/1697");
    expect(flatten_nav_hrefs(cards!.items)).toContain(
      "/credit-cards/mbb-2-gold/8060",
    );
    expect(flatten_nav_hrefs(cards!.items)).not.toContain(
      "/credit-cards/mbb-visa-1697",
    );
  });

  it("distinguishes full active on MBB 2 Gold vs ancestor when a nested card is open", () => {
    const cards = NAV_GROUPS.find((g) => g.title === "Credit cards");
    const gold = cards!.items.find((i) => i.label === "MBB 2 Gold")!;
    const amex = gold.children!.find((c) => c.href.includes("8060"))!;

    expect(
      nav_item_is_active("/credit-cards/mbb-2-gold/8060", amex),
    ).toBe(true);
    expect(nav_item_route_emphasis("/credit-cards/mbb-2-gold/8060", amex)).toBe(
      "active",
    );
    expect(
      nav_item_is_active("/credit-cards/mbb-2-gold/8060", gold),
    ).toBe(false);
    expect(nav_item_route_emphasis("/credit-cards/mbb-2-gold/8060", gold)).toBe(
      "ancestor",
    );
    expect(nav_item_is_marked("/credit-cards/mbb-2-gold/8060", gold)).toBe(true);
    expect(
      nav_item_has_active_descendant("/credit-cards/mbb-2-gold/8060", gold),
    ).toBe(true);

    expect(nav_item_is_active("/credit-cards/mbb-2-gold", gold)).toBe(true);
    expect(nav_item_route_emphasis("/credit-cards/mbb-2-gold", gold)).toBe(
      "active",
    );
    expect(
      nav_item_route_emphasis("/credit-cards/mbb-2-gold", amex),
    ).toBeNull();
    expect(nav_item_is_active("/credit-cards/mbb-2-gold/statement", gold)).toBe(
      true,
    );
    expect(
      nav_item_is_active("/credit-cards/mbb-2-gold/1697/statement", gold),
    ).toBe(false);
  });
});