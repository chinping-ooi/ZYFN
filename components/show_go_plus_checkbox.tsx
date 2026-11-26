"use client";

import { use_show_go_plus } from "@/lib/hooks/use_show_go_plus";

export function ShowGoPlusCheckbox() {
  const { show_go_plus, set_show_go_plus } = use_show_go_plus();

  return (
    <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
      <input
        type="checkbox"
        className="size-3.5 rounded-[2px] border border-zyfn-line"
        checked={show_go_plus}
        onChange={(e) => set_show_go_plus(e.target.checked)}
        aria-label="Show GO+ transactions"
      />
      <span>Show GO+ transactions</span>
    </label>
  );
}