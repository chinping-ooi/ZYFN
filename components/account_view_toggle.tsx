"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChartPie, List } from "lucide-react";
import { useWorkspaceToolbar } from "@/components/workspace_toolbar_context";
import { account_statement_href } from "@/lib/accounts/view_paths";

const SEGMENT =
  "inline-flex shrink-0 rounded-[3px] border border-zyfn-line bg-white p-0.5";
const BTN =
  "inline-flex h-8 w-8 items-center justify-center rounded-[2px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60";
const BTN_ACTIVE = "bg-zyfn-navy text-white";
const BTN_IDLE = "text-zyfn-ink hover:bg-[#f4f6f8]";

export function AccountViewToggle({
  view_base_path,
  active_view,
}: {
  view_base_path: string;
  active_view: "statement" | "summary";
}) {
  const { set_account_view } = useWorkspaceToolbar();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const query_suffix = query ? `?${query}` : "";
  const summary_href = `${view_base_path}${query_suffix}`;
  const statement_href = `${account_statement_href(view_base_path)}${query_suffix}`;

  return (
    <div className={SEGMENT} role="group" aria-label="Account view">
      <Link
        href={summary_href}
        className={`${BTN} ${active_view === "summary" ? BTN_ACTIVE : BTN_IDLE}`}
        title="Summary"
        aria-label="Summary"
        aria-current={active_view === "summary" ? "page" : undefined}
        onClick={() => set_account_view("summary")}
      >
        <ChartPie className="size-4" aria-hidden />
      </Link>
      <Link
        href={statement_href}
        className={`${BTN} ${active_view === "statement" ? BTN_ACTIVE : BTN_IDLE}`}
        title="Account statement"
        aria-label="Account statement"
        aria-current={active_view === "statement" ? "page" : undefined}
        onClick={() => set_account_view("statement")}
      >
        <List className="size-4" aria-hidden />
      </Link>
    </div>
  );
}