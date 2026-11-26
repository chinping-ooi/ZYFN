import { describe, expect, it } from "vitest";
import {
  flatten_nav_hrefs,
  NAV_GROUPS,
  nav_item_has_active_descendant,
  nav_item_is_active,
  nav_item_is_marked,
} from "@/lib/accounts/nav";

describe("account navigation", () => {
  it("shows a single Touch 'n Go wallet link", () => {
    const wallet_group = NAV_GROUPS.find((g) => g.title === "Wallets");
    expect(wallet_group).toBeDefined();
    const hrefs = wallet_group!.items.map((i) => i.href);
    expect(hrefs).toContain("/transactions/touch-n-go");
    expect(hrefs).not.toContain("/transactions/tng-ewallet");
    expect(hrefs).not.toContain("/transactions/tng-go-plus");
    const tng_labels = wallet_group!.items.filter((i) =>
      i.label.includes("Touch"),
    );
    expect(tng_labels).toHaveLength(1);
    expect(tng_labels[0].label).toBe("Touch 'n Go");
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

  it("marks MBB 2 Gold active when a nested card is open", () => {
    const cards = NAV_GROUPS.find((g) => g.title === "Credit cards");
    const gold = cards!.items.find((i) => i.label === "MBB 2 Gold")!;
    const child = gold.children![0]!;
    expect(
      nav_item_is_active(
        "/credit-cards/mbb-2-gold/1697/summary",
        child,
      ),
    ).toBe(true);
    expect(nav_item_is_marked("/credit-cards/mbb-2-gold/1697/summary", gold)).toBe(
      true,
    );
    expect(
      nav_item_has_active_descendant(
        "/credit-cards/mbb-2-gold/1697/summary",
        gold,
      ),
    ).toBe(true);
    expect(
      nav_item_is_marked("/credit-cards/mbb-2-gold", gold),
    ).toBe(true);
  });
});