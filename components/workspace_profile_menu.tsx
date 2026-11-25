"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings } from "lucide-react";

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
    <div ref={root_ref} className="relative shrink-0">
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-left transition-shadow hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 ${
          open ? "ring-2 ring-slate-200" : ""
        }`}
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
        <span className="hidden text-[13px] font-medium text-slate-700 sm:inline">
          Chin Ping
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id={menu_id}
          role="menu"
          className="absolute right-0 z-50 mt-1.5 min-w-[11.5rem] overflow-hidden rounded-lg border border-zyfn-line bg-white shadow-md"
        >
          <div className="px-3 py-2.5 text-sm font-semibold text-zyfn-ink">
            Chin Ping
          </div>
          <div className="border-t border-slate-200" role="separator" />
          <ul className="m-0 list-none p-1">
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-zyfn-ink hover:bg-slate-50"
                onClick={() => set_open(false)}
              >
                <Settings className="size-4 shrink-0 text-slate-500" aria-hidden />
                Settings
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                onClick={() => set_open(false)}
              >
                <LogOut className="size-4 shrink-0" aria-hidden />
                Sign out
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}