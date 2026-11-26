import { describe, expect, it } from "vitest";
import { pdf_upload_detection_warning } from "@/lib/import/pdf_upload_detection";
import { tng_wallet_is_likely_statement } from "@/lib/import/parsers/tng_wallet";
import { statement_detection_corpus } from "@/lib/import/statement_detection";

const MINIMAL_TNG = `
TNG WALLET TRANSACTION HISTORY
Wallet ID 1234567890
Transaction Period 1 November 2026 - 15 November 2026
TNG WALLET TRANSACTION
1/11/2026 Success Reload 88110022 Quick Reload Payment (via GO+ Balance) RM1.00 RM2.00
GO+ TRANSACTION
1/11/2026 Success GO+ Daily Earnings RM0.0012 RM1.0012
`;

describe("pdf_upload_detection_warning", () => {
  it("does not require PDF metadata for TNG detection corpus", () => {
    const with_pdfium = statement_detection_corpus(MINIMAL_TNG, {
      creator: "PDFium",
    });
    expect(tng_wallet_is_likely_statement(MINIMAL_TNG)).toBe(true);
    expect(tng_wallet_is_likely_statement(with_pdfium)).toBe(true);
    expect(
      pdf_upload_detection_warning(MINIMAL_TNG, {
        detected_account_count: 2,
        ocr_pages: 0,
      }),
    ).toBeNull();
  });

  it("warns when TNG keywords are present but nothing was auto-detected", () => {
    const broken =
      "TNG WALLET TRANSACTION HISTORY Wallet ID 1 Transaction Period Nov 2026";
    expect(
      pdf_upload_detection_warning(broken, {
        detected_account_count: 0,
        ocr_pages: 0,
      }),
    ).toMatch(/Touch 'n Go eWallet/);
  });
});