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

export type MonthOption = { value: string; label: string };

type WorkspaceToolbarContextValue = {
  month_options: MonthOption[];
  register_month_options: (options: MonthOption[]) => void;
};

const WorkspaceToolbarContext = createContext<WorkspaceToolbarContextValue | null>(
  null,
);

export function WorkspaceToolbarProvider({ children }: { children: ReactNode }) {
  const [month_options, set_month_options] = useState<MonthOption[]>([]);

  const register_month_options = useCallback((options: MonthOption[]) => {
    set_month_options(options);
  }, []);

  const value = useMemo(
    () => ({ month_options, register_month_options }),
    [month_options, register_month_options],
  );

  return (
    <WorkspaceToolbarContext.Provider value={value}>
      {children}
    </WorkspaceToolbarContext.Provider>
  );
}

export function useWorkspaceToolbar() {
  const ctx = useContext(WorkspaceToolbarContext);
  if (!ctx) {
    throw new Error("useWorkspaceToolbar requires WorkspaceToolbarProvider");
  }
  return ctx;
}

/** Publish month dropdown options for the global header (clears on unmount). */
export function useWorkspaceMonthOptions(options: MonthOption[]) {
  const { register_month_options } = useWorkspaceToolbar();

  useEffect(() => {
    register_month_options(options);
    return () => register_month_options([]);
  }, [register_month_options, options]);
}