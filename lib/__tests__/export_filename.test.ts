import { describe, expect, it } from "vitest";
import { build_import_preview_export_filename } from "@/lib/export_filename";

describe("build_import_preview_export_filename", () => {
  it("slugifies account label with export date", () => {
    expect(
      build_import_preview_export_filename(
        "Public Bank Quantum MC",
        new Date("2025-10-24T12:00:00Z"),
      ),
    ).toBe("import_preview_public_bank_quantum_mc_20251024.xlsx");
  });
});