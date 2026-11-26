import {
  parse_tng_wallet_statement,
  tng_wallet_has_keyword_hints,
  tng_wallet_is_likely_statement,
} from "@/lib/import/parsers/tng_wallet";

export function pdf_upload_detection_warning(
  text: string,
  options: {
    detected_account_count: number;
    ocr_pages: number;
    extraction_failed?: boolean;
  },
): string | null {
  if (options.extraction_failed) {
    return "Could not read text from this PDF. Try another export or re-save without a password.";
  }

  const trimmed = text.trim();
  if (tng_wallet_is_likely_statement(text)) {
    const parsed = parse_tng_wallet_statement(text);
    if (parsed.accounts.length === 0) {
      return "Touch 'n Go eWallet statement was recognized but no transaction rows were extracted. Rotated or scrambled text layers can cause this — try printing to PDF again with pages upright, or use the text export.";
    }
    return null;
  }

  if (
    options.detected_account_count === 0 &&
    tng_wallet_has_keyword_hints(text)
  ) {
    return "This PDF looks like a Touch 'n Go eWallet history but could not be auto-detected. The text layer may be incomplete (rotated print-to-PDF is a common cause). Choose TNG accounts manually or re-export the statement.";
  }

  if (
    options.detected_account_count === 0 &&
    trimmed.length < 80 &&
    options.ocr_pages > 0
  ) {
    return "Little text was found in this PDF; OCR was used but may still be incomplete. You can pick an account manually if parsing works.";
  }

  return null;
}