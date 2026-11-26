import { describe, expect, it } from "vitest";
import {
  default_statement_month_key,
  resolve_statement_month_from_query,
} from "@/lib/datetime/default_statement_month";

describe("default_statement_month_key", () => {
  it("uses previous month in Asia/Kuala_Lumpur", () => {
    const as_of = new Date("2026-11-15T12:00:00+08:00");
    expect(default_statement_month_key(as_of)).toBe("2026-10");
  });

  it("rolls January back to December of prior year", () => {
    const as_of = new Date("2026-01-10T12:00:00+08:00");
    expect(default_statement_month_key(as_of)).toBe("2025-12");
  });
});

describe("resolve_statement_month_from_query", () => {
  it("respects explicit month query", () => {
    expect(resolve_statement_month_from_query("2025-03")).toBe("2025-03");
  });

  it("respects all months query", () => {
    expect(resolve_statement_month_from_query("all")).toBe("all");
  });

  it("falls back to default when query absent", () => {
    const as_of = new Date("2026-11-15T12:00:00+08:00");
    expect(default_statement_month_key(as_of)).toBe("2026-10");
    expect(resolve_statement_month_from_query(null)).toBe(
      default_statement_month_key(),
    );
  });
});