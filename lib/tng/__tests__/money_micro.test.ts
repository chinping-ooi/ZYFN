import { describe, expect, it } from "vitest";
import { format_micro_money, micro_to_sen_display } from "@/lib/tng/money_micro";

describe("format_micro_money", () => {
  it("displays exactly 2 decimal places after summing micro", () => {
    const total = 7_569_092 + 256_492;
    expect(format_micro_money(total, 4)).toBe("782.56");
    expect(micro_to_sen_display(7_569_092)).toBe(75_691);
    expect(format_micro_money(7_569_092, 4)).toBe("756.91");
    expect(format_micro_money(256_492, 4)).toBe("25.65");
  });
});