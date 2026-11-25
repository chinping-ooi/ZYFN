"use client";

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
    <label className="select-wrap relative inline-block">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        className="h-[var(--control-height,36px)] min-w-40 appearance-none rounded-[3px] border border-[#b8c2cf] bg-white pr-9 pl-3 text-sm leading-5 text-zyfn-ink"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute top-2 right-3 text-zyfn-muted"
        aria-hidden
      >
        ⌄
      </span>
    </label>
  );
}