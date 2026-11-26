import { describe, expect, it } from "vitest";
import {
  append_month_query,
  mbb_2_gold_card_href,
  mbb_2_gold_card_summary_href,
  mbb_2_gold_combined_href,
  mbb_2_gold_legacy_statement_redirect,
  mbb_2_gold_legacy_summary_redirect,
} from "@/lib/credit_cards/mbb_2_gold_routes";

describe("mbb_2_gold_routes", () => {
  it("defines nested card paths", () => {
    expect(mbb_2_gold_combined_href()).toBe("/credit-cards/mbb-2-gold");
    expect(mbb_2_gold_card_href("1697")).toBe("/credit-cards/mbb-2-gold/1697");
    expect(mbb_2_gold_card_summary_href("8060")).toBe(
      "/credit-cards/mbb-2-gold/8060/summary",
    );
  });

  it("redirects legacy slugs", () => {
    expect(mbb_2_gold_legacy_statement_redirect("mbb-visa-1697")).toBe(
      "/credit-cards/mbb-2-gold/1697",
    );
    expect(mbb_2_gold_legacy_summary_redirect("mbb-amex-8060")).toBe(
      "/credit-cards/mbb-2-gold/8060/summary",
    );
  });

  it("preserves month query on redirect", () => {
    expect(
      append_month_query("/credit-cards/mbb-2-gold/1697", { month: "2026-09" }),
    ).toBe("/credit-cards/mbb-2-gold/1697?month=2026-09");
  });
});