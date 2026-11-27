"use client";

import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MonthSelect } from "@/components/month_select";
import { AccountViewToggle } from "@/components/account_view_toggle";
import { useWorkspaceToolbar } from "@/components/workspace_toolbar_context";
import { useGlobalMonthUrl } from "@/lib/hooks/use_global_month_url";
import {
  account_view_from_pathname,
  global_month_hidden_path,
} from "@/lib/accounts/header_view_paths";
import {
  ensure_month_in_options,
  resolve_statement_month_from_query,
} from "@/lib/datetime/default_statement_month";

export function WorkspaceHeaderControls() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { month_options } = useWorkspaceToolbar();
  const { set_month_param } = useGlobalMonthUrl();

  const account_view = account_view_from_pathname(pathname);
  const show_month =
    !global_month_hidden_path(pathname) && month_options.length > 0;

  const available_month_keys = useMemo(
    () => month_options.map((o) => o.value).filter((v) => v !== "all"),
    [month_options],
  );

  const month = useMemo(
    () =>
      resolve_statement_month_from_query(
        searchParams.get("month"),
        available_month_keys,
      ),
    [searchParams, available_month_keys],
  );

  const resolved_options = useMemo(
    () => ensure_month_in_options(month_options, month),
    [month_options, month],
  );

  if (!show_month && !account_view) return null;

  return (
    <div
      className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto"
      data-global-workspace-controls
    >
      {show_month ? (
        <MonthSelect
          label="Statement month"
          value={month}
          options={resolved_options}
          onChange={(v) => set_month_param(v as typeof month)}
        />
      ) : null}
      {account_view ? (
        <AccountViewToggle
          view_base_path={account_view.view_base_path}
          active_view={account_view.active_view}
        />
      ) : null}
    </div>
  );
}