import { describe, expect, it } from "vitest";
import { layout_text_from_items } from "@/lib/import/pdf_layout";
import { parse_pbe_card_statement } from "@/lib/import/parsers/pbe_card";

/**
 * Simulates pdfjs token positions (synthetic values only).
 * Expects 3 transactions: 2 debits + 1 CR payment, opening + grand total 0.
 */
describe("pbe_card parser with pdfjs-style layout", () => {
  it("parses rows when dates, descriptions, and CR are split tokens", () => {
    const y_header = 720;
    const y_statement = 698;
    const y_card = 676;
    const y_section = 660;
    const y_open = 640;
    const y_txn1 = 620;
    const y_txn2 = 600;
    const y_txn3 = 580;
    const y_foot1 = 540;
    const y_foot2 = 520;
    const y_foot3 = 500;

    const items = [
      { page: 1, str: "PUBLIC BANK BERHAD", x: 40, y: y_header + 20 },
      { page: 1, str: "PENYATA KAD / CARD STATEMENT", x: 40, y: y_header },
      {
        page: 1,
        str: "Tarikh Penyata / Statement Date",
        x: 40,
        y: y_statement,
      },
      { page: 1, str: "16", x: 220, y: y_statement },
      { page: 1, str: "NOV", x: 240, y: y_statement },
      { page: 1, str: "2026", x: 270, y: y_statement },
      { page: 1, str: "MASTERCARD QUANTUM", x: 40, y: y_card },
      { page: 1, str: "1111", x: 180, y: y_card },
      { page: 1, str: "2222", x: 220, y: y_card },
      { page: 1, str: "3333", x: 260, y: y_card },
      { page: 1, str: "6357", x: 300, y: y_card },
      { page: 1, str: "Maklumat Transaksi", x: 40, y: y_section + 8 },
      { page: 1, str: "Transaction Details", x: 40, y: y_section },
      { page: 1, str: "17", x: 36, y: y_open },
      { page: 1, str: "OCT", x: 52, y: y_open },
      { page: 1, str: "Previous", x: 120, y: y_open },
      { page: 1, str: "Balance", x: 175, y: y_open },
      { page: 1, str: "25.00", x: 480, y: y_open },
      { page: 1, str: "25", x: 36, y: y_txn1 },
      { page: 1, str: "OCT", x: 52, y: y_txn1 },
      { page: 1, str: "25", x: 88, y: y_txn1 },
      { page: 1, str: "OCT", x: 104, y: y_txn1 },
      { page: 1, str: "SHOP", x: 140, y: y_txn1 },
      { page: 1, str: "ABC", x: 175, y: y_txn1 },
      { page: 1, str: "PENANG", x: 260, y: y_txn1 },
      { page: 1, str: "16.90", x: 480, y: y_txn1 },
      { page: 1, str: "25", x: 36, y: y_txn2 },
      { page: 1, str: "OCT", x: 52, y: y_txn2 },
      { page: 1, str: "24", x: 88, y: y_txn2 },
      { page: 1, str: "OCT", x: 104, y: y_txn2 },
      { page: 1, str: "PETROL", x: 140, y: y_txn2 },
      { page: 1, str: "STN", x: 190, y: y_txn2 },
      { page: 1, str: "50.00", x: 480, y: y_txn2 },
      { page: 1, str: "01", x: 36, y: y_txn3 },
      { page: 1, str: "NOV", x: 52, y: y_txn3 },
      { page: 1, str: "01", x: 88, y: y_txn3 },
      { page: 1, str: "NOV", x: 104, y: y_txn3 },
      { page: 1, str: "PBeBANK", x: 140, y: y_txn3 },
      { page: 1, str: "PAYMENT", x: 195, y: y_txn3 },
      { page: 1, str: "-", x: 260, y: y_txn3 },
      { page: 1, str: "THANK YOU", x: 270, y: y_txn3 },
      { page: 1, str: "91.90", x: 470, y: y_txn3 },
      { page: 1, str: "CR", x: 512, y: y_txn3 },
      { page: 1, str: "This month total credit", x: 40, y: y_foot1 },
      { page: 1, str: "91.90", x: 480, y: y_foot1 },
      { page: 1, str: "This month total debit", x: 40, y: y_foot2 },
      { page: 1, str: "66.90", x: 480, y: y_foot2 },
      {
        page: 1,
        str: "Jumlah besar untuk akaun ini / Grand total for this account",
        x: 40,
        y: y_foot3,
      },
      { page: 1, str: "0.00", x: 480, y: y_foot3 },
    ];

    const text = layout_text_from_items(items);
    const { rows, section_found, parse_warning } = parse_pbe_card_statement(text);
    expect(section_found).toBe(true);
    expect(parse_warning).toBeNull();
    expect(rows).toHaveLength(3);
    expect(rows.filter((r) => r.direction === "out")).toHaveLength(2);
    expect(rows.filter((r) => r.direction === "in")).toHaveLength(1);
    expect(rows.find((r) => r.txn_type === "cc_payment")?.amount_major).toBe(
      "91.90",
    );
    expect(rows.filter((r) => r.txn_type === "purchase")).toHaveLength(2);
    const chron = [...rows].sort((a, b) => a.txn_at.localeCompare(b.txn_at));
    expect(chron.at(-1)?.balance_after_major).toBe("0.00");
  });
});