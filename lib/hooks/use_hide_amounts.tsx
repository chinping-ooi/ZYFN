"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  read_hide_amounts_pref,
  write_hide_amounts_pref,
} from "@/lib/hooks/hide_amounts_storage";

export type HideAmountsContextValue = {
  /** When true, monetary values should render as `RM ***`. */
  amounts_hidden: boolean;
  /** False until client has read localStorage (avoids SSR mismatch). */
  hydrated: boolean;
  toggle_amounts_hidden: () => void;
  set_amounts_hidden: (hidden: boolean) => void;
};

const HideAmountsContext = createContext<HideAmountsContextValue | null>(null);

function useHideAmountsController(): HideAmountsContextValue {
  const [amounts_hidden, set_amounts_hidden] = useState(false);
  const [hydrated, set_hydrated] = useState(false);

  useEffect(() => {
    const stored = read_hide_amounts_pref();
    // Hydrate from localStorage after mount (default visible for SSR).
    queueMicrotask(() => {
      set_amounts_hidden(stored);
      set_hydrated(true);
    });
  }, []);

  const set_and_persist = useCallback((hidden: boolean) => {
    set_amounts_hidden(hidden);
    write_hide_amounts_pref(hidden);
  }, []);

  const toggle_amounts_hidden = useCallback(() => {
    set_amounts_hidden((prev) => {
      const next = !prev;
      write_hide_amounts_pref(next);
      return next;
    });
  }, []);

  return useMemo(
    () => ({
      amounts_hidden,
      hydrated,
      toggle_amounts_hidden,
      set_amounts_hidden: set_and_persist,
    }),
    [amounts_hidden, hydrated, toggle_amounts_hidden, set_and_persist],
  );
}

export function HideAmountsProvider({ children }: { children: ReactNode }) {
  const value = useHideAmountsController();
  return (
    <HideAmountsContext.Provider value={value}>
      {children}
    </HideAmountsContext.Provider>
  );
}

/** Shared hide-amounts preference (localStorage). Uses context when wrapped. */
export function useHideAmounts(): HideAmountsContextValue {
  const ctx = useContext(HideAmountsContext);
  const standalone = useHideAmountsController();
  return ctx ?? standalone;
}

/** @alias useHideAmounts */
export const use_hide_amounts = useHideAmounts;