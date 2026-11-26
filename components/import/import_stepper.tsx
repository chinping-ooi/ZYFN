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
      className="mb-5 rounded-[3px] border border-zyfn-line bg-white px-3 py-3 sm:px-5 sm:py-4"
    >
      <ol className="flex items-start justify-between gap-1 sm:gap-2">
        {STEPS.map((step, index) => {
          const idx = ORDER.indexOf(step.key);
          const is_map = step.key === "map";
          const skipped = is_map && mapping_skipped && active_index > idx;
          const done = active_index > idx || (current === "done" && index < 3);
          const active = current === step.key;
          const pending = active_index < idx && !skipped;

          let circle_class =
            "border-[#b8c2cf] bg-white text-slate-500";
          if (skipped) {
            circle_class = "border-slate-300 bg-slate-50 text-slate-400";
          } else if (done) {
            circle_class = "border-zyfn-navy bg-zyfn-navy text-white";
          } else if (active) {
            circle_class = "border-zyfn-navy bg-white text-zyfn-navy ring-2 ring-sky-400/30";
          }

          return (
            <li
              key={step.key}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <span
                    className={`hidden h-px flex-1 sm:block ${
                      done || active_index > idx
                        ? "bg-zyfn-navy/40"
                        : "bg-[#d5dbe3]"
                    }`}
                    aria-hidden
                  />
                ) : (
                  <span className="hidden flex-1 sm:block" aria-hidden />
                )}
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold sm:size-8 sm:text-[13px] ${circle_class}`}
                >
                  {done && !skipped ? (
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
                className={`mt-1.5 hidden text-center text-[11px] leading-tight sm:block ${
                  active
                    ? "font-semibold text-zyfn-navy"
                    : skipped
                      ? "text-slate-400"
                      : pending
                        ? "text-slate-400"
                        : "text-slate-600"
                }`}
              >
                {step.label}
                {skipped ? " (auto)" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-center text-xs text-slate-600 sm:hidden">
        Step {STEPS.find((s) => s.key === current)?.number ?? 1}:{" "}
        {STEPS.find((s) => s.key === current)?.label ?? ""}
        {current === "preview" && mapping_skipped ? " · mapping skipped" : ""}
      </p>
    </nav>
  );
}