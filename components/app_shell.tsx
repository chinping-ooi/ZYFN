"use client";

import { useCallback, useState } from "react";
import { Menu } from "lucide-react";
import { MOBILE_DRAWER_ID, Sidebar } from "@/components/sidebar";
import { WorkspaceProfileMenu } from "@/components/workspace_profile_menu";
import { APP_VERSION } from "@/lib/app_version";
import { format_last_updated_footer } from "@/lib/last_updated";

export function AppShell({
  title,
  children,
  last_updated = null,
  viewport_lock = false,
  dashboard_grid = false,
}: {
  title: string;
  children: React.ReactNode;
  last_updated?: string | null;
  viewport_lock?: boolean;
  dashboard_grid?: boolean;
}) {
  const [mobile_nav, set_mobile_nav] = useState(false);
  const close_nav = useCallback(() => set_mobile_nav(false), []);
  const footer_right = last_updated
    ? format_last_updated_footer(last_updated)
    : null;

  return (
    <div className="shell flex h-screen min-h-screen min-w-0 overflow-hidden">
      <Sidebar mobile_open={mobile_nav} on_close={close_nav} />
      <div className="workspace flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
        <header className="topbar flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-zyfn-line bg-white px-4 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 lg:hidden"
              aria-expanded={mobile_nav}
              aria-controls={MOBILE_DRAWER_ID}
              onClick={() => set_mobile_nav(true)}
            >
              <Menu className="size-5" aria-hidden />
              <span className="sr-only">Open navigation</span>
            </button>
            <h1 className="m-0 min-w-0 truncate text-lg font-semibold lg:text-xl">
              {title}
            </h1>
          </div>
          <WorkspaceProfileMenu />
        </header>
        <main
          className={`content mx-auto flex w-full min-w-0 max-w-[1560px] flex-1 flex-col ${
            dashboard_grid
              ? "dashboard-main min-h-0 flex-1 overflow-y-auto overflow-x-auto lg:overflow-x-hidden"
              : `px-4 lg:px-8 ${viewport_lock ? "py-3 lg:py-3" : "py-4 lg:py-6"} min-h-0 overflow-x-auto ${
                  viewport_lock
                    ? "overflow-y-auto lg:overflow-y-hidden lg:overflow-x-hidden"
                    : "overflow-y-auto"
                }`
          }`}
        >
          {children}
        </main>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-zyfn-line bg-white px-4 py-3 text-xs leading-5 text-zyfn-muted lg:px-8">
          <span>
            © 2026 ZYFN · v{APP_VERSION}
          </span>
          {footer_right ? <span>{footer_right}</span> : null}
        </footer>
      </div>
    </div>
  );
}