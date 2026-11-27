import { describe, expect, it } from "vitest";
import {
  account_view_from_pathname,
  global_month_hidden_path,
} from "@/lib/accounts/header_view_paths";

describe("header_view_paths", () => {
  it("hides month on import", () => {
    expect(global_month_hidden_path("/import")).toBe(true);
    expect(global_month_hidden_path("/")).toBe(false);
  });

  it("detects transaction account views", () => {
    expect(account_view_from_pathname("/transactions/maybank")).toEqual({
      view_base_path: "/transactions/maybank",
      active_view: "summary",
    });
    expect(account_view_from_pathname("/transactions/maybank/statement")).toEqual(
      {
        view_base_path: "/transactions/maybank",
        active_view: "statement",
      },
    );
  });

  it("detects credit-card nested card views", () => {
    expect(
      account_view_from_pathname("/credit-cards/mbb-2-gold/1697/statement"),
    ).toEqual({
      view_base_path: "/credit-cards/mbb-2-gold/1697",
      active_view: "statement",
    });
  });
});