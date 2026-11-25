"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";

export function AppShell({
  title,
  description,
  children,
  footer_note = "Illustrative figures · MYR",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer_note?: string;
}) {
  const [mobile_nav, set_mobile_nav] = useState(false);

  return (
    <div className="shell flex min-h-screen min-w-[1100px]">
      <Sidebar
        mobile_open={mobile_nav}
        on_close={() => set_mobile_nav(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="topbar flex min-h-16 shrink-0 items-center justify-between border-b border-zyfn-line bg-white px-6 lg:px-8">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="page-btn mt-0.5 lg:hidden"
              aria-expanded={mobile_nav}
              aria-controls="mobile-sidebar"
              onClick={() => set_mobile_nav((v) => !v)}
            >
              Menu
            </button>
            <div>
              <h1 className="m-0 text-xl font-semibold">{title}</h1>
              <p className="m-0 mt-0.5 text-xs text-zyfn-muted">{description}</p>
            </div>
          </div>
          <div className="hidden text-[13px] text-zyfn-muted sm:block">
            Personal workspace
          </div>
        </header>
        <main className="content mx-auto w-full max-w-[1560px] flex-1 px-6 py-6 lg:px-8">
          {children}
        </main>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-zyfn-line bg-white px-6 py-3 text-xs leading-5 text-zyfn-muted lg:px-8">
          <span>ZYFN · Personal finance</span>
          <span>{footer_note}</span>
        </footer>
      </div>
    </div>
  );
}