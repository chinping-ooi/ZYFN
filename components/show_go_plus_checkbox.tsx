"use client";

export function ShowGoPlusCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (show: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
      <input
        type="checkbox"
        className="size-3.5 rounded-[2px] border border-zyfn-line"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label="Show GO+ transactions"
      />
      <span>Show GO+ transactions</span>
    </label>
  );
}