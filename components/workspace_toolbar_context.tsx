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
  read_account_view_preference,
  write_account_view_preference,
  type AccountViewMode,
} from "@/lib/accounts/account_view_preference";

export type MonthOption = { value: string; label: string };

type WorkspaceToolbarContextValue = {
  month_options: MonthOption[];
  register_month_options: (options: MonthOption[]) => void;
  account_view: AccountViewMode;
  set_account_view: (mode: AccountViewMode) => void;
};

const WorkspaceToolbarContext = createContext<WorkspaceToolbarContextValue | null>(
  null,
);

export function WorkspaceToolbarProvider({ children }: { children: ReactNode }) {
  const [month_options, set_month_options] = useState<MonthOption[]>([]);
  const [account_view, set_account_view_state] = useState<AccountViewMode>(() =>
    typeof window !== "undefined" ? read_account_view_preference() : "summary",
  );

  useEffect(() => {
    const on_change = () => {
      set_account_view_state(read_account_view_preference());
    };
    window.addEventListener("zyfn-account-view-change", on_change);
    return () => window.removeEventListener("zyfn-account-view-change", on_change);
  }, []);

  const register_month_options = useCallback((options: MonthOption[]) => {
    set_month_options(options);
  }, []);

  const set_account_view = useCallback((mode: AccountViewMode) => {
    write_account_view_preference(mode);
    set_account_view_state(mode);
  }, []);

  const value = useMemo(
    () => ({
      month_options,
      register_month_options,
      account_view,
      set_account_view,
    }),
    [month_options, register_month_options, account_view, set_account_view],
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