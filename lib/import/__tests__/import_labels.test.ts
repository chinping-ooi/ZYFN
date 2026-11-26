import { describe, expect, it } from "vitest";
import {
  import_row_status_label,
  parser_display_name,
} from "@/lib/import/import_labels";

describe("import_labels", () => {
  it("maps parser ids to plain names", () => {
    expect(parser_display_name("pbe_card")).toBe("Public Bank credit card");
    expect(parser_display_name("generic")).toBe("Generic table");
  });

  it("maps row statuses for badges", () => {
    expect(import_row_status_label("new")).toBe("To be added");
    expect(import_row_status_label("duplicate")).toBe("Already saved");
    expect(import_row_status_label("needs_review")).toBe("Please check");
  });
});