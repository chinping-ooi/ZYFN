"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useNavGroups } from "@/components/nav_groups_provider";
import { DASHBOARD_HREF } from "@/lib/navigation";

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
  default_open,
  pathname,
  on_navigate,
}: {
  title: string;
  items: { href: string; label: string }[];
  default_open?: boolean;
  pathname: string;
  on_navigate: () => void;
}) {
  const contains_active = items.some((item) => item.href === pathname);
  const initial_open = default_open ?? contains_active;
  const GroupIcon = GROUP_ICONS[title];

  return (
    <details className="nav-section group/nav mt-3" open={initial_open}>
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
          const active = pathname === item.href;
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

  return (
    <>
      <header className="brand flex min-h-16 items-center border-b border-[#38465a] px-6 text-[22px] font-semibold tracking-[2px]">
        ZYFN
      </header>
      <nav
        className="nav flex-1 overflow-y-auto p-3 pt-3"
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
        {nav_groups.map((group) => (
          <NavGroupSection
            key={group.title}
            title={group.title}
            items={group.items}
            default_open={group.defaultOpen}
            pathname={pathname}
            on_navigate={on_navigate}
          />
        ))}
      </nav>
      <footer className="side-foot shrink-0 border-t border-[#38465a] px-6 py-3 text-xs leading-5 text-[#aeb8c6]">
        Supabase · read-only ledger
      </footer>
    </>
  );
}

export function Sidebar({ mobile_open, on_close }: SidebarProps) {
  const pathname = usePathname();
  const nav_groups = useNavGroups();

  return (
    <>
      <aside
        className="sidebar sticky top-0 hidden h-screen w-[224px] shrink-0 flex flex-col border-r border-[#152235] bg-zyfn-sidebar text-white lg:flex"
        aria-label="Main navigation"
      >
        <SidebarPanel
          pathname={pathname}
          on_navigate={on_close}
          nav_groups={nav_groups}
        />
      </aside>
      {mobile_open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#132238]/60"
            aria-label="Close navigation"
            onClick={on_close}
          />
          <aside className="relative flex h-full w-[min(280px,85vw)] flex-col bg-zyfn-sidebar text-white shadow-xl">
            <SidebarPanel
              pathname={pathname}
              on_navigate={on_close}
              nav_groups={nav_groups}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}