"use client";

import type { ReactNode } from "react";

export function AccountPageHeader({
  title,
  controls,
}: {
  title: string;
  controls?: ReactNode;
  /** @deprecated Global header owns view toggle; kept for call-site compatibility. */
  view_base_path?: string;
  /** @deprecated */
  active_view?: "statement" | "summary";
  /** @deprecated */
  hide_view_toggle?: boolean;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="m-0 min-w-0 text-[17px] font-semibold">{title}</h2>
      {controls ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          {controls}
        </div>
      ) : null}
    </div>
  );
}