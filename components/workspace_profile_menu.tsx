"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export function WorkspaceProfileMenu() {
  const [open, set_open] = useState(false);
  const root_ref = useRef<HTMLDivElement>(null);
  const menu_id = useId();

  useEffect(() => {
    if (!open) return;
    function on_key(e: KeyboardEvent) {
      if (e.key === "Escape") set_open(false);
    }
    function on_pointer(e: MouseEvent) {
      if (
        root_ref.current &&
        !root_ref.current.contains(e.target as Node)
      ) {
        set_open(false);
      }
    }
    document.addEventListener("keydown", on_key);
    document.addEventListener("mousedown", on_pointer);
    return () => {
      document.removeEventListener("keydown", on_key);
      document.removeEventListener("mousedown", on_pointer);
    };
  }, [open]);

  return (
    <div ref={root_ref} className="relative hidden sm:block">
      <button
        type="button"
        className="page-btn flex items-center gap-2 border-transparent py-1.5 pl-1.5 pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menu_id}
        onClick={() => set_open((v) => !v)}
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-white"
          aria-hidden
        >
          CP
        </span>
        <span className="text-[13px] font-medium text-zyfn-ink">Chin Ping</span>
        <ChevronDown
          className={`size-4 shrink-0 text-zyfn-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          id={menu_id}
          role="menu"
          className="absolute right-0 z-50 mt-1.5 min-w-[11rem] list-none rounded-[3px] border border-zyfn-line bg-white py-1 shadow-lg"
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-zyfn-ink hover:bg-[#f0f3f7]"
              onClick={() => set_open(false)}
            >
              Settings
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-zyfn-ink hover:bg-[#f0f3f7]"
              onClick={() => set_open(false)}
            >
              Sign out
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}