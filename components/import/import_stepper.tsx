"use client";

import { Check } from "lucide-react";

export type ImportWizardStep = "start" | "map" | "preview" | "done";

export type ImportStepperStep = {
  key: ImportWizardStep;
  label: string;
};

/** Upload → Review → Done when mapping is skipped or not yet known. */
export function import_stepper_steps(
  include_mapping_step: boolean,
): ImportStepperStep[] {
  if (include_mapping_step) {
    return [
      { key: "start", label: "Upload" },
      { key: "map", label: "Match columns" },
      { key: "preview", label: "Review" },
      { key: "done", label: "Done" },
    ];
  }
  return [
    { key: "start", label: "Upload" },
    { key: "preview", label: "Review" },
    { key: "done", label: "Done" },
  ];
}

export function import_stepper_active_index(
  current: ImportWizardStep,
  include_mapping_step: boolean,
): number {
  const steps = import_stepper_steps(include_mapping_step);
  const index = steps.findIndex((step) => step.key === current);
  return index >= 0 ? index : 0;
}

/** Grid track list: circle — flex line — circle — … (edge circles hug padding). */
export function import_stepper_grid_template_columns(step_count: number): string {
  return Array.from({ length: step_count }, (_, index) =>
    index === 0 ? "auto" : "minmax(1rem,1fr) auto",
  ).join(" ");
}

const CIRCLE_REACHED = "border-zyfn-navy bg-zyfn-navy text-white";
const CIRCLE_PENDING = "border-[#b8c2cf] bg-white text-slate-400";

export function ImportStepper({
  current,
  include_mapping_step,
}: {
  current: ImportWizardStep;
  include_mapping_step: boolean;
}) {
  const steps = import_stepper_steps(include_mapping_step);
  const active_index = import_stepper_active_index(current, include_mapping_step);
  const active_step = steps[active_index];
  const grid_columns = import_stepper_grid_template_columns(steps.length);

  return (
    <nav
      aria-label="Import progress"
      className="w-full shrink-0 rounded-[3px] border border-zyfn-line bg-white px-4 py-4"
    >
      <ol
        className="grid w-full items-center gap-y-1.5"
        style={{ gridTemplateColumns: grid_columns }}
      >
        {steps.map((step, index) => {
          const behind = active_index > index;
          const active = current === step.key;
          const reached = behind || active;
          const circle_class = reached ? CIRCLE_REACHED : CIRCLE_PENDING;
          const display_number = index + 1;
          const column = 2 * index + 1;
          const is_first = index === 0;
          const is_last = index === steps.length - 1;
          const justify = is_first ? "start" : is_last ? "end" : "center";
          const label_align = is_first
            ? "text-left"
            : is_last
              ? "text-right"
              : "text-center";

          return (
            <li
              key={`${step.key}-${include_mapping_step}`}
              className="contents"
            >
              {index > 0 ? (
                <span
                  aria-hidden
                  className={`hidden h-px w-full self-center sm:block ${
                    active_index >= index ? "bg-zyfn-navy/40" : "bg-[#d5dbe3]"
                  }`}
                  style={{ gridColumn: 2 * index, gridRow: 1 }}
                />
              ) : null}
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold sm:size-8 sm:text-[13px] ${circle_class}`}
                style={{ gridColumn: column, gridRow: 1, justifySelf: justify }}
              >
                {behind ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  display_number
                )}
              </span>
              <span
                className={`hidden max-w-[6.5rem] text-[11px] leading-tight sm:max-w-[7.5rem] md:block ${label_align} ${
                  active
                    ? "font-semibold text-zyfn-navy"
                    : reached
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
                style={{ gridColumn: column, gridRow: 2, justifySelf: justify }}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-xs text-slate-600 sm:hidden">
        Step {active_index + 1}: {active_step?.label ?? ""}
      </p>
    </nav>
  );
}