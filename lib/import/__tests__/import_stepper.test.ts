import { describe, expect, it } from "vitest";
import {
  import_stepper_active_index,
  import_stepper_steps,
} from "@/components/import/import_stepper";

describe("import_stepper_steps", () => {
  it("shows three steps before mapping is known or when mapping is skipped", () => {
    const steps = import_stepper_steps(false);
    expect(steps.map((s) => s.label)).toEqual(["Upload", "Review", "Done"]);
    expect(steps).toHaveLength(3);
  });

  it("shows four steps when spreadsheet mapping is required", () => {
    const steps = import_stepper_steps(true);
    expect(steps.map((s) => s.label)).toEqual([
      "Upload",
      "Match columns",
      "Review",
      "Done",
    ]);
  });
});

describe("import_stepper_active_index", () => {
  it("numbers Review as step 2 when column mapping is skipped", () => {
    expect(import_stepper_active_index("preview", false)).toBe(1);
  });

  it("numbers Review as step 3 when mapping step is included", () => {
    expect(import_stepper_active_index("preview", true)).toBe(2);
  });

  it("keeps Upload as step 1 on the short path", () => {
    expect(import_stepper_active_index("start", false)).toBe(0);
  });
});