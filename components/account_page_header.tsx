"use client";

import type { ReactNode } from "react";
import { AccountViewTabs } from "@/components/account_view_tabs";

export function AccountPageHeader({
  title,
  view_base_path,
  active_view,
  controls,
  hide_view_tabs = false,
  show_mbb_2_gold_link = false,
}: {
  title: string;
  view_base_path: string;
  active_view: "statement" | "summary";
  controls?: ReactNode;
  hide_view_tabs?: boolean;
  show_mbb_2_gold_link?: boolean;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
        {hide_view_tabs ? null : (
          <AccountViewTabs
            view_base_path={view_base_path}
            active={active_view}
            show_mbb_2_gold_link={show_mbb_2_gold_link}
          />
        )}
      </div>
      {controls ? <div className="shrink-0">{controls}</div> : null}
    </div>
  );
}