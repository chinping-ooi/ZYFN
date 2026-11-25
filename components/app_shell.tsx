"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
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
  /** ISO date (YYYY-MM-DD) for footer; hidden when null/undefined. */
  last_updated?: string | null;
  viewport_lock?: boolean;
  dashboard_grid?: boolean;
}) {
  const [mobile_nav, set_mobile_nav] = useState(false);
  const footer_right = last_updated
    ? format_last_updated_footer(last_updated)
    : null;

  return (
    <div className="shell flex h-screen min-h-screen min-w-0 overflow-hidden">
      <Sidebar
        mobile_open={mobile_nav}
        on_close={() => set_mobile_nav(false)}
      />
      <div className="workspace flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="topbar flex min-h-16 shrink-0 items-center justify-between border-b border-zyfn-line bg-white px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="page-btn lg:hidden"
              aria-expanded={mobile_nav}
              aria-controls="mobile-sidebar"
              onClick={() => set_mobile_nav((v) => !v)}
            >
              Menu
            </button>
            <h1 className="m-0 text-xl font-semibold">{title}</h1>
          </div>
          <WorkspaceProfileMenu />
        </header>
        <main
          className={`content mx-auto flex w-full max-w-[1560px] flex-1 flex-col ${
            dashboard_grid
              ? "dashboard-main min-h-0 overflow-x-hidden"
              : `px-6 lg:px-8 ${viewport_lock ? "py-3 lg:py-3" : "py-6"} min-h-0 overflow-x-hidden ${
                  viewport_lock
                    ? "overflow-y-auto lg:overflow-y-hidden"
                    : "overflow-y-auto"
                }`
          }`}
        >
          {children}
        </main>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-zyfn-line bg-white px-6 py-3 text-xs leading-5 text-zyfn-muted lg:px-8">
          <span>
            © 2026 ZYFN · v{APP_VERSION}
          </span>
          {footer_right ? <span>{footer_right}</span> : null}
        </footer>
      </div>
    </div>
  );
}