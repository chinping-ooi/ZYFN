"use client";

import { createContext, useContext, useMemo } from "react";
import { merge_nav_groups, NAV_GROUPS, type NavGroup } from "@/lib/navigation";

const NavGroupsContext = createContext<NavGroup[]>(NAV_GROUPS);

export function NavGroupsProvider({
  bank_codes: _bank_codes,
  children,
}: {
  bank_codes: string[];
  children: React.ReactNode;
}) {
  void _bank_codes;
  const groups = useMemo(() => merge_nav_groups(NAV_GROUPS), []);
  return (
    <NavGroupsContext.Provider value={groups}>
      {children}
    </NavGroupsContext.Provider>
  );
}

export function useNavGroups(): NavGroup[] {
  return useContext(NavGroupsContext);
}