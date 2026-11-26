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

  return (
    <nav
      aria-label="Import progress"
      className="w-full shrink-0 rounded-[3px] border border-zyfn-line bg-white px-4 py-4"
    >
      <ol className="flex items-start justify-between gap-1 sm:gap-2">
        {steps.map((step, index) => {
          const behind = active_index > index;
          const active = current === step.key;
          const reached = behind || active;
          const circle_class = reached ? CIRCLE_REACHED : CIRCLE_PENDING;
          const display_number = index + 1;

          return (
            <li
              key={`${step.key}-${include_mapping_step}`}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <span
                    className={`hidden h-px flex-1 sm:block ${
                      active_index > index ? "bg-zyfn-navy/40" : "bg-[#d5dbe3]"
                    }`}
                    aria-hidden
                  />
                ) : (
                  <span className="hidden flex-1 sm:block" aria-hidden />
                )}
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold sm:size-8 sm:text-[13px] ${circle_class}`}
                >
                  {behind ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    display_number
                  )}
                </span>
                {index < steps.length - 1 ? (
                  <span
                    className={`hidden h-px flex-1 sm:block ${
                      active_index > index ? "bg-zyfn-navy/40" : "bg-[#d5dbe3]"
                    }`}
                    aria-hidden
                  />
                ) : (
                  <span className="hidden flex-1 sm:block" aria-hidden />
                )}
              </div>
              <span
                className={`mt-1.5 hidden text-center text-[11px] leading-tight md:block ${
                  active
                    ? "font-semibold text-zyfn-navy"
                    : reached
                      ? "text-slate-600"
                      : "text-slate-400"
                }`}
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