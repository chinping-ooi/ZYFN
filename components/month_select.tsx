"use client";

import { SelectChevron } from "@/components/select_chevron";

type Option = { value: string; label: string };

export function MonthSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-wrap relative inline-block w-full min-w-0 max-w-full text-zyfn-muted sm:w-auto sm:max-w-none">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-[var(--control-height,36px)] w-full min-w-0 max-w-full appearance-none rounded-[3px] border border-[#b8c2cf] bg-white py-0 pr-9 pl-3 text-sm leading-[36px] text-zyfn-ink sm:min-w-40 sm:w-auto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <SelectChevron />
    </label>
  );
}