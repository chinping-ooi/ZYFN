import { describe, expect, it } from "vitest";
import {
  should_show_detected_upload_accounts,
  should_show_upload_account_select,
} from "@/lib/import/import_upload_account";

const SAMPLE_ACCOUNTS = [
  {
    account_id: 8,
    account_ref: "MBB_VISA_1697",
    account_label: "MBB Visa 1697",
  },
  {
    account_id: 9,
    account_ref: "MBB_AMEX_8060",
    account_label: "MBB Amex 8060",
  },
];

describe("import upload account panel", () => {
  it("shows detected chips for PDF with auto-detected accounts", () => {
    expect(
      should_show_detected_upload_accounts({
        has_file: true,
        source_kind: "pdf",
        detected_accounts: [SAMPLE_ACCOUNTS[0]],
        account_select_override: false,
      }),
    ).toBe(true);
    expect(
      should_show_upload_account_select({
        has_file: true,
        source_kind: "pdf",
        detected_accounts: [SAMPLE_ACCOUNTS[0]],
        account_select_override: false,
      }),
    ).toBe(false);
  });

  it("shows multi-account chips without the select", () => {
    expect(
      should_show_detected_upload_accounts({
        has_file: true,
        source_kind: "pdf",
        detected_accounts: SAMPLE_ACCOUNTS,
        account_select_override: false,
      }),
    ).toBe(true);
  });

  it("shows select for spreadsheets and PDF fallback", () => {
    expect(
      should_show_upload_account_select({
        has_file: true,
        source_kind: "csv",
        detected_accounts: [],
        account_select_override: false,
      }),
    ).toBe(true);
    expect(
      should_show_upload_account_select({
        has_file: true,
        source_kind: "pdf",
        detected_accounts: [],
        account_select_override: false,
      }),
    ).toBe(true);
  });

  it("reveals select when the user overrides detection", () => {
    expect(
      should_show_detected_upload_accounts({
        has_file: true,
        source_kind: "pdf",
        detected_accounts: SAMPLE_ACCOUNTS,
        account_select_override: true,
      }),
    ).toBe(false);
    expect(
      should_show_upload_account_select({
        has_file: true,
        source_kind: "pdf",
        detected_accounts: SAMPLE_ACCOUNTS,
        account_select_override: true,
      }),
    ).toBe(true);
  });
});