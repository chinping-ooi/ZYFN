"use client";

import { Check } from "lucide-react";

export type ImportWizardStep = "start" | "map" | "preview" | "done";

type StepDef = {
  key: ImportWizardStep | "map";
  number: number;
  label: string;
};

const STEPS: StepDef[] = [
  { key: "start", number: 1, label: "Account & statement" },
  { key: "map", number: 2, label: "Column mapping" },
  { key: "preview", number: 3, label: "Preview" },
  { key: "done", number: 4, label: "Complete" },
];

const ORDER: Array<ImportWizardStep | "map"> = [
  "start",
  "map",
  "preview",
  "done",
];

function step_index(step: ImportWizardStep): number {
  return ORDER.indexOf(step);
}

const CIRCLE_REACHED = "border-zyfn-navy bg-zyfn-navy text-white";
const CIRCLE_PENDING = "border-[#b8c2cf] bg-white text-slate-400";

export function ImportStepper({
  current,
  mapping_skipped,
}: {
  current: ImportWizardStep;
  mapping_skipped: boolean;
}) {
  const active_index = step_index(current);

  return (
    <nav
      aria-label="Import progress"
      className="w-full shrink-0 rounded-[3px] border border-zyfn-line bg-white px-4 py-4"
    >
      <ol className="flex items-start justify-between gap-1 sm:gap-2">
        {STEPS.map((step, index) => {
          const idx = ORDER.indexOf(step.key);
          const is_map = step.key === "map";
          const behind = active_index > idx;
          const skipped_map = is_map && mapping_skipped && behind;
          const active = current === step.key;
          const reached = behind || active;

          const circle_class = reached ? CIRCLE_REACHED : CIRCLE_PENDING;
          const connector_filled = active_index > index;

          return (
            <li
              key={step.key}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <span
                    className={`hidden h-px flex-1 sm:block ${
                      connector_filled ? "bg-zyfn-navy/40" : "bg-[#d5dbe3]"
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
                    step.number
                  )}
                </span>
                {index < STEPS.length - 1 ? (
                  <span
                    className={`hidden h-px flex-1 sm:block ${
                      active_index > idx ? "bg-zyfn-navy/40" : "bg-[#d5dbe3]"
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
                {skipped_map ? "Skipped" : step.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-xs text-slate-600 sm:hidden">
        Step {STEPS.find((s) => s.key === current)?.number ?? 1}:{" "}
        {current === "preview" && mapping_skipped
          ? "Column mapping skipped"
          : (STEPS.find((s) => s.key === current)?.label ?? "")}
      </p>
    </nav>
  );
}