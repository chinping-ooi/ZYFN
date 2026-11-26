"use client";

import type { ReactNode } from "react";
import type { AccountRoutePrefix } from "@/lib/accounts/types";
import { AccountViewTabs } from "@/components/account_view_tabs";

export function AccountPageHeader({
  title,
  route_prefix,
  account_slug,
  active_view,
  controls,
}: {
  title: string;
  route_prefix: AccountRoutePrefix;
  account_slug: string;
  active_view: "statement" | "summary";
  controls?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
        <AccountViewTabs
          route_prefix={route_prefix}
          account_slug={account_slug}
          active={active_view}
        />
      </div>
      {controls ? <div className="shrink-0">{controls}</div> : null}
    </div>
  );
}