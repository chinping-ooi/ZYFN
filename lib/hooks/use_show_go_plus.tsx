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
  DEFAULT_SHOW_GO_PLUS,
  read_show_go_plus_pref,
  write_show_go_plus_pref,
} from "@/lib/hooks/show_go_plus_storage";

export type ShowGoPlusContextValue = {
  show_go_plus: boolean;
  hydrated: boolean;
  set_show_go_plus: (show: boolean) => void;
};

const ShowGoPlusContext = createContext<ShowGoPlusContextValue | null>(null);

function useShowGoPlusController(): ShowGoPlusContextValue {
  const [show_go_plus, set_show] = useState(DEFAULT_SHOW_GO_PLUS);
  const [hydrated, set_hydrated] = useState(false);

  useEffect(() => {
    const stored = read_show_go_plus_pref();
    queueMicrotask(() => {
      set_show(stored);
      set_hydrated(true);
    });
  }, []);

  const set_show_go_plus = useCallback((show: boolean) => {
    set_show(show);
    write_show_go_plus_pref(show);
  }, []);

  return useMemo(
    () => ({ show_go_plus, hydrated, set_show_go_plus }),
    [show_go_plus, hydrated, set_show_go_plus],
  );
}

export function ShowGoPlusProvider({ children }: { children: ReactNode }) {
  const value = useShowGoPlusController();
  return (
    <ShowGoPlusContext.Provider value={value}>
      {children}
    </ShowGoPlusContext.Provider>
  );
}

export function useShowGoPlus(): ShowGoPlusContextValue {
  const ctx = useContext(ShowGoPlusContext);
  const standalone = useShowGoPlusController();
  return ctx ?? standalone;
}

export const use_show_go_plus = useShowGoPlus;