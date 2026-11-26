"use client";

import type { ReactNode } from "react";
import { AccountViewToggle } from "@/components/account_view_toggle";

export function AccountPageHeader({
  title,
  view_base_path,
  active_view,
  controls,
  hide_view_toggle = false,
}: {
  title: string;
  view_base_path: string;
  active_view: "statement" | "summary";
  controls?: ReactNode;
  hide_view_toggle?: boolean;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="m-0 min-w-0 text-[17px] font-semibold">{title}</h2>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {controls}
        {hide_view_toggle ? null : (
          <AccountViewToggle
            view_base_path={view_base_path}
            active_view={active_view}
          />
        )}
      </div>
    </div>
  );
}