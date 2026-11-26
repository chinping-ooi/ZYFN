import { describe, expect, it } from "vitest";
import { NAV_GROUPS } from "@/lib/accounts/nav";

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

  it("links MBB 2 Gold combined summary in Credit cards", () => {
    const cards = NAV_GROUPS.find((g) => g.title === "Credit cards");
    expect(cards).toBeDefined();
    const gold = cards!.items.find((i) => i.label === "MBB 2 Gold");
    expect(gold?.href).toBe("/credit-cards/mbb-2-gold/summary");
  });
});