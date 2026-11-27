import { describe, expect, it } from "vitest";
import { resolve_fd_month_from_query } from "@/lib/hooks/use_fixed_deposit_month";
import { resolve_statement_month_from_query } from "@/lib/datetime/default_statement_month";

describe("global month URL resolution", () => {
  it("defaults to previous KL month when query is absent", () => {
    const keys = ["2026-09", "2026-10"];
    const month = resolve_statement_month_from_query(null, keys);
    expect(keys).toContain(month);
    expect(month).not.toBe("all");
  });

  it("respects month=all in query", () => {
    expect(resolve_fd_month_from_query("all", ["2026-10"])).toBe("all");
  });

  it("writes through explicit month keys", () => {
    expect(resolve_statement_month_from_query("2026-09", ["2026-09"])).toBe(
      "2026-09",
    );
  });
});