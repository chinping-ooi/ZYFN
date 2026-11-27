import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-chartjs-2", () => ({
  Doughnut: () => null,
}));

import { SpendingBreakdownCard } from "@/components/spending_breakdown_card";

describe("SpendingBreakdownCard", () => {
  it("renders empty state without crashing", () => {
    const html = renderToStaticMarkup(
      createElement(SpendingBreakdownCard, {
        rows: [],
        content_sized: true,
      }),
    );
    expect(html).toContain("Spending breakdown");
    expect(html).not.toContain("By account");
  });

  it("renders donut layout when rows exist", () => {
    const html = renderToStaticMarkup(
      createElement(SpendingBreakdownCard, {
        rows: [
          {
            id: "purchase",
            label: "purchase",
            account_type: "",
            amount_sen: 12_500,
            count: 2,
            pct: 100,
          },
        ],
        content_sized: true,
        column_fill: true,
      }),
    );
    expect(html).toContain("Spending breakdown");
    expect(html).toContain("purchase");
    expect(html).toContain("Total");
  });
});