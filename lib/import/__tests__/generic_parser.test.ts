import { describe, expect, it } from "vitest";
import { generic_statement_parser } from "@/lib/import/parsers/generic";

describe("generic_statement_parser", () => {
  it("parses dated lines with debit/credit pattern", () => {
    const text = [
      "01/11/2025 GROCERY STORE 45.90 1,234.56",
      "02/11/2025 SALARY 0.00 3,500.00",
    ].join("\n");
    const rows = generic_statement_parser().parse(text);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.txn_at).toBe("2025-11-01T00:00:00Z");
    expect(rows[0]?.description).toBe("GROCERY STORE");
  });
});