import { describe, expect, it } from "vitest";
import { parse_csv_text } from "@/lib/import/excel";

describe("parse_csv_text", () => {
  it("maps synthetic CSV headers", () => {
    const csv = [
      "Date,Description,Debit,Credit,Balance",
      "2025-11-01,Test merchant,12.50,,987.50",
      "2025-11-02,Salary,,2000.00,2987.50",
    ].join("\n");
    const { rows } = parse_csv_text(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.direction).toBe("out");
    expect(rows[1]?.direction).toBe("in");
  });
});