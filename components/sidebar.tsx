"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNavGroups } from "@/components/nav_groups_provider";
import { DASHBOARD_HREF } from "@/lib/navigation";

type SidebarProps = {
  mobile_open: boolean;
  on_close: () => void;
};

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

  return (
    <details className="nav-section group/nav mb-0.5" open={initial_open}>
      <summary className="nav-group flex list-none cursor-pointer items-center justify-between rounded-[3px] px-3.5 py-2 text-sm text-[#c1cad7] hover:bg-zyfn-sidebar-hover hover:text-white [&::-webkit-details-marker]:hidden">
        {title}
        <span
          className="mr-0.5 h-1.5 w-1.5 -rotate-45 border-r border-b border-current transition-transform duration-200 group-open/nav:rotate-45 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="nav-children pb-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={on_navigate}
              className={`nav-item mb-0.5 flex min-h-[38px] items-center rounded-[3px] py-2 pr-3.5 pl-7 text-sm no-underline ${
                active
                  ? "active bg-zyfn-sidebar-active font-semibold text-white"
                  : "font-normal text-[#c1cad7] hover:bg-zyfn-sidebar-hover hover:text-white"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
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
  return (
    <>
      <header className="brand flex min-h-16 items-center border-b border-[#38465a] px-6 text-[22px] font-semibold tracking-[2px]">
        ZYFN
      </header>
      <nav className="nav flex-1 overflow-y-auto p-3 pt-4" aria-label="Workspace pages">
        <Link
          href={DASHBOARD_HREF}
          onClick={on_navigate}
          className={`nav-item mb-0.5 flex min-h-[38px] items-center rounded-[3px] px-3.5 py-2 text-sm no-underline ${
            pathname === DASHBOARD_HREF
              ? "active bg-zyfn-sidebar-active font-semibold text-white"
              : "text-[#c1cad7] hover:bg-zyfn-sidebar-hover hover:text-white"
          }`}
          aria-current={pathname === DASHBOARD_HREF ? "page" : undefined}
        >
          Dashboard
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