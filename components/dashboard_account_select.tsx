"use client";

import { SelectChevron } from "@/components/select_chevron";

export function DashboardAccountSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-wrap relative inline-block text-zyfn-muted">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-[var(--control-height,36px)] min-w-48 appearance-none rounded-[3px] border border-[#b8c2cf] bg-white py-0 pr-9 pl-3 text-sm leading-[36px] text-zyfn-ink"
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