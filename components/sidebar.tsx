"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Upload,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useNavGroups } from "@/components/nav_groups_provider";
import { DASHBOARD_HREF, IMPORT_HREF, type NavItem } from "@/lib/navigation";

const MOBILE_DRAWER_ID = "mobile-sidebar";

type SidebarProps = {
  mobile_open: boolean;
  on_close: () => void;
};

const GROUP_ICONS: Record<string, LucideIcon> = {
  Transactions: Landmark,
  "Credit cards": CreditCard,
  Wallets: Wallet,
  "Fixed deposits": PiggyBank,
};

const GROUP_SUMMARY_CLASS =
  "nav-group flex list-none cursor-pointer items-center justify-between rounded-[3px] px-3.5 py-1.5 text-[13px] font-semibold text-slate-300 hover:bg-zyfn-sidebar-hover hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 [&::-webkit-details-marker]:hidden";

const NAV_LINK_BASE =
  "nav-item relative flex min-h-8 max-h-[34px] items-center rounded-[3px] text-[13px] no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60";

function NavGroupSection({
  title,
  items,
  pathname,
  on_navigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  on_navigate: () => void;
}) {
  const GroupIcon = GROUP_ICONS[title];
  const [open, set_open] = useState(true);

  return (
    <details
      className="nav-section group/nav mt-3"
      open={open}
      onToggle={(e) => set_open(e.currentTarget.open)}
    >
      <summary className={GROUP_SUMMARY_CLASS}>
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          {GroupIcon ? (
            <GroupIcon className="size-4 shrink-0 text-slate-300" aria-hidden />
          ) : null}
          <span className="truncate">{title}</span>
        </span>
        <span
          className="mr-0.5 h-1.5 w-1.5 shrink-0 -rotate-45 border-r border-b border-current text-slate-400 transition-transform duration-200 group-open/nav:rotate-45 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="nav-children ml-[22px] border-l border-slate-700 pb-0.5 pt-0.5">
        {items.map((item) => {
          const active =
            item.active_match === "prefix"
              ? pathname === item.href ||
                pathname.startsWith(`${item.href}/`)
              : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={on_navigate}
              className={`${NAV_LINK_BASE} mb-px py-1.5 pr-3 pl-3 last:mb-0 ${
                active
                  ? "active bg-white/10 font-medium text-white"
                  : "font-normal text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <span
                  className="pointer-events-none absolute top-1 bottom-1 -left-px w-0.5 bg-sky-400"
                  aria-hidden
                />
              ) : null}
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}

function SidebarPanel({
  pathname,
  on_navigate,
  nav_groups,
}: {
  pathname: string;
  on_navigate: () => void;
  nav_groups: ReturnType<typeof useNavGroups>;
}) {
  const dashboard_active = pathname === DASHBOARD_HREF;
  const import_active = pathname === IMPORT_HREF;

  return (
    <>
      <nav
        className="nav min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pt-3"
        aria-label="Workspace pages"
      >
        <Link
          href={DASHBOARD_HREF}
          onClick={on_navigate}
          className={`${NAV_LINK_BASE} gap-2.5 px-3.5 py-1.5 ${
            dashboard_active
              ? "active bg-white/10 font-medium text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          aria-current={dashboard_active ? "page" : undefined}
        >
          {dashboard_active ? (
            <span
              className="pointer-events-none absolute top-1 bottom-1 left-0 w-0.5 rounded-full bg-sky-400"
              aria-hidden
            />
          ) : null}
          <LayoutDashboard
            className="size-4 shrink-0 text-slate-300"
            aria-hidden
          />
          <span>Dashboard</span>
        </Link>
        <Link
          href={IMPORT_HREF}
          onClick={on_navigate}
          className={`${NAV_LINK_BASE} mt-1 gap-2.5 px-3.5 py-1.5 ${
            import_active
              ? "active bg-white/10 font-medium text-white"
              : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          aria-current={import_active ? "page" : undefined}
        >
          {import_active ? (
            <span
              className="pointer-events-none absolute top-1 bottom-1 left-0 w-0.5 rounded-full bg-sky-400"
              aria-hidden
            />
          ) : null}
          <Upload className="size-4 shrink-0 text-slate-300" aria-hidden />
          <span>Import</span>
        </Link>
        {nav_groups.map((group) => (
          <NavGroupSection
            key={group.title}
            title={group.title}
            items={group.items}
            pathname={pathname}
            on_navigate={on_navigate}
          />
        ))}
      </nav>
    </>
  );
}

function SidebarBrand({ on_close }: { on_close?: () => void }) {
  return (
    <header className="brand flex h-16 shrink-0 items-center justify-between border-b border-[#38465a] px-5">
      <span className="text-[22px] font-semibold tracking-[2px]">ZYFN</span>
      {on_close ? (
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-slate-300 hover:bg-zyfn-sidebar-hover hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
          aria-label="Close navigation"
          onClick={on_close}
        >
          <X className="size-5" aria-hidden />
        </button>
      ) : null}
    </header>
  );
}

export function Sidebar({ mobile_open, on_close }: SidebarProps) {
  const pathname = usePathname();
  const nav_groups = useNavGroups();

  useEffect(() => {
    on_close();
  }, [pathname, on_close]);

  useEffect(() => {
    if (!mobile_open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobile_open]);

  useEffect(() => {
    if (!mobile_open) return;
    function on_key(e: KeyboardEvent) {
      if (e.key === "Escape") on_close();
    }
    document.addEventListener("keydown", on_key);
    return () => document.removeEventListener("keydown", on_key);
  }, [mobile_open, on_close]);

  return (
    <>
      <aside
        className="sidebar sticky top-0 hidden h-screen w-[224px] shrink-0 flex-col border-r border-[#152235] bg-zyfn-sidebar text-white lg:flex lg:flex-col"
        aria-label="Main navigation"
      >
        <SidebarBrand />
        <SidebarPanel
          pathname={pathname}
          on_navigate={on_close}
          nav_groups={nav_groups}
        />
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobile_open ? "" : "pointer-events-none"
        }`}
        aria-hidden={!mobile_open}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            mobile_open ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close navigation"
          tabIndex={mobile_open ? 0 : -1}
          onClick={on_close}
        />
        <aside
          id={MOBILE_DRAWER_ID}
          className={`relative flex h-full w-[260px] max-w-[85vw] flex-col bg-zyfn-sidebar text-white shadow-xl transition-transform duration-200 ease-out motion-reduce:transition-none ${
            mobile_open ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Main navigation"
          aria-hidden={!mobile_open}
        >
          <SidebarBrand on_close={on_close} />
          <SidebarPanel
            pathname={pathname}
            on_navigate={on_close}
            nav_groups={nav_groups}
          />
        </aside>
      </div>
    </>
  );
}

export { MOBILE_DRAWER_ID };