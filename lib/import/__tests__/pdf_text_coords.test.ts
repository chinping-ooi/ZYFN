import { describe, expect, it } from "vitest";
import { group_text_items_into_lines } from "@/lib/import/pdf_layout";
import {
  a4_rotate_90_viewport_transform,
  layout_items_from_viewport,
} from "@/lib/import/pdf_text_coords";
import {
  parse_tng_wallet_statement,
  tng_wallet_is_likely_statement,
} from "@/lib/import/parsers/tng_wallet";

describe("pdf viewport text coordinates", () => {
  it("groups tokens on the same visual row when the page is rotated 90°", () => {
    const viewport = a4_rotate_90_viewport_transform(595);
    const items = layout_items_from_viewport(
      [
        { str: "TNG", transform: [1, 0, 0, 1, 52, 120] },
        { str: "WALLET", transform: [1, 0, 0, 1, 52, 138] },
        { str: "TRANSACTION", transform: [1, 0, 0, 1, 52, 156] },
        { str: "HISTORY", transform: [1, 0, 0, 1, 52, 174] },
      ],
      viewport,
    );
    const lines = group_text_items_into_lines(items);
    expect(
      lines.some((line) =>
        /TNG\s+WALLET\s+TRANSACTION\s+HISTORY/i.test(line),
      ),
    ).toBe(true);
  });

  it("reconstructs a TNG wallet statement from rotated PDFium-style layout items", () => {
    const viewport = a4_rotate_90_viewport_transform(595);
    let row_x = 420;
    const row = (tokens: string[]) => {
      const items: Array<{ str: string; transform: number[] }> = [];
      let y = 80;
      for (const str of tokens) {
        items.push({ str, transform: [1, 0, 0, 1, row_x, y] });
        y += 14;
      }
      row_x -= 22;
      return items;
    };

    const raw_items = [
      ...row(["TNG", "WALLET", "TRANSACTION", "HISTORY"]),
      ...row(["Registered", "Name", "Sample", "User"]),
      ...row(["Wallet", "ID", "1234567890"]),
      ...row(["Transaction", "Period", "1", "November", "2026"]),
      ...row(["TNG", "WALLET", "TRANSACTION"]),
      ...row([
        "1/11/2026",
        "Success",
        "Reload",
        "88110022",
        "Quick",
        "Reload",
        "Payment",
        "(via",
        "GO+",
        "Balance)",
        "RM1.00",
        "RM2.00",
      ]),
      ...row(["GO+", "TRANSACTION"]),
      ...row([
        "1/11/2026",
        "Success",
        "GO+",
        "Daily",
        "Earnings",
        "RM0.0012",
        "RM1.0012",
      ]),
    ];

    const items = layout_items_from_viewport(raw_items, viewport);

    const text = group_text_items_into_lines(items).join("\n");
    expect(text).toMatch(/TNG\s+WALLET\s+TRANSACTION\s+HISTORY/i);
    expect(text).toMatch(/GO\+\s+TRANSACTION/i);
    expect(tng_wallet_is_likely_statement(text)).toBe(true);
    const { rows, accounts } = parse_tng_wallet_statement(text);
    expect(accounts.length).toBeGreaterThanOrEqual(1);
    expect(rows.length).toBeGreaterThan(0);
  });
});